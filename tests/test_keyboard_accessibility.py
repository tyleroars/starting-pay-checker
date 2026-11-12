"""Offline UI regression tests. See tests/README.md for setup."""
import json
import os
import unittest
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

BASE_URL = os.environ.get('TEST_BASE_URL', 'http://127.0.0.1:3315')
OCCUPATIONS = [
    {
        'code': f'15-{i:04d}', 'title': f'Test occupation {i:02d}',
        'category': 'Tech' if i % 2 == 0 else 'Education',
        'entryPay': 40000 + i * 1000, 'median': 70000, 'p75': 90000,
        'education': "Bachelor's", 'employment': 10000,
        'degrees': ['Computer Science'],
    }
    for i in range(42)
]


class KeyboardAccessibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        options = {'headless': True}
        if os.environ.get('CHROMIUM_EXECUTABLE'):
            options['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
        cls.browser = cls.playwright.chromium.launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.route('**/*', self.route)
        self.page.goto(BASE_URL)
        expect(self.page.locator('.occupation-toggle')).to_have_count(40)

    def route(self, route):
        request = urlparse(route.request.url)
        if request.path == '/api/occupations':
            route.fulfill(content_type='application/json', body=json.dumps({
                'occupations': OCCUPATIONS, 'count': len(OCCUPATIONS), 'year': 2024,
            }))
        elif request.netloc == urlparse(BASE_URL).netloc:
            route.continue_()
        else:
            route.abort()  # No real Redis, fonts, analytics, or external requests.

    def tearDown(self):
        self.page.close()
        self.assertEqual(self.errors, [])

    def tab_to(self, locator):
        for _ in range(100):
            self.page.keyboard.press('Tab')
            if locator.evaluate('(el) => el === document.activeElement'):
                return
        self.fail('Control was not reachable with Tab')

    def assert_focus_ring(self, locator):
        self.assertEqual(locator.evaluate('(el) => getComputedStyle(el).outlineStyle'), 'solid')
        self.assertEqual(locator.evaluate('(el) => getComputedStyle(el).outlineWidth'), '3px')

    def test_disclosure_keyboard_and_pointer(self):
        first, second = self.page.locator('.occupation-toggle').nth(0), self.page.locator('.occupation-toggle').nth(1)
        panel = self.page.locator('#' + first.get_attribute('aria-controls'))
        self.tab_to(first)
        self.assert_focus_ring(first)
        expect(first).to_have_attribute('aria-expanded', 'false')
        expect(panel).to_be_hidden()
        self.page.keyboard.press('Enter')
        expect(first).to_have_attribute('aria-expanded', 'true')
        expect(panel).to_be_visible()
        expect(first).to_be_focused()
        self.page.keyboard.press('Space')
        expect(panel).to_be_hidden()
        self.page.keyboard.press('Space')
        expect(panel).to_be_visible()
        self.page.keyboard.press('Tab')
        expect(second).to_be_focused()
        self.page.keyboard.press('Enter')
        expect(first).to_have_attribute('aria-expanded', 'false')
        expect(second).to_have_attribute('aria-expanded', 'true')
        second.click()
        expect(second).to_have_attribute('aria-expanded', 'false')
        first.click()
        expect(panel).to_be_visible()

    def test_labels_filters_and_pagination(self):
        search = self.page.get_by_role('textbox', name='Search occupations')
        minimum = self.page.get_by_role('combobox', name='Min pay')
        self.tab_to(search)
        self.assert_focus_ring(search)
        self.page.keyboard.type('Test occupation 00')
        expect(self.page.locator('.occupation-toggle')).to_have_count(1)
        search.fill('')
        self.page.keyboard.press('Tab')
        expect(minimum).to_be_focused()
        self.assert_focus_ring(minimum)
        minimum.select_option('80000')
        expect(self.page.locator('.occupation-toggle')).to_have_count(2)
        minimum.select_option('0')
        tech = self.page.get_by_role('button', name='Tech', exact=True)
        self.tab_to(tech)
        self.page.keyboard.press('Space')
        expect(tech).to_have_attribute('aria-pressed', 'true')
        expect(self.page.get_by_role('button', name='All fields', exact=True)).to_have_attribute('aria-pressed', 'false')
        expect(self.page.locator('.occupation-toggle')).to_have_count(21)
        self.page.get_by_role('button', name='All fields', exact=True).click()
        more = self.page.get_by_role('button', name='Show more (2 remaining)')
        self.tab_to(more)
        self.page.keyboard.press('Enter')
        expect(self.page.locator('.occupation-toggle')).to_have_count(42)
        expect(more).to_have_count(0)

    def test_mobile_layout_and_disclosure(self):
        self.page.set_viewport_size({'width': 390, 'height': 844})
        first = self.page.locator('.occupation-toggle').first
        self.tab_to(first)
        self.page.keyboard.press('Enter')
        expect(first).to_have_attribute('aria-expanded', 'true')
        self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))

    def test_mobile_reverse_tab_clears_sticky_headers(self):
        self.page.set_viewport_size({'width': 390, 'height': 844})
        self.tab_to(self.page.locator('.occupation-toggle').first)
        self.page.wait_for_timeout(700)  # Allow CSS smooth scrolling to finish.
        sales = self.page.get_by_role('button', name='Sales', exact=True)
        for _ in range(30):
            self.page.keyboard.press('Shift+Tab')
            self.page.wait_for_timeout(700)
            bounds = self.page.locator(':focus').evaluate('''(el) => ({
                top: el.getBoundingClientRect().top,
                stickyBottom: document.querySelector('nav').nextElementSibling.getBoundingClientRect().bottom,
            })''')
            self.assertGreaterEqual(bounds['top'], bounds['stickyBottom'])
            if sales.evaluate('(el) => el === document.activeElement'):
                return
        self.fail('Sales filter was not reachable with Shift+Tab')


if __name__ == '__main__':
    unittest.main(verbosity=2)
