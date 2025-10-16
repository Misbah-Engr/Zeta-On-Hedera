from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://172.17.0.1:5173")
    page.screenshot(path="jules-scratch/verification/screenshot.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)