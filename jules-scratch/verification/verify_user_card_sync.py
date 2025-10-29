
from playwright.sync_api import sync_playwright, expect
import time

def main():
    with sync_playwright() as p:
        try:
            # Connect to the running Electron app on its debug port
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
            context = browser.contexts[0]
            page = context.pages[0]

            print("✅ Connecté à l'application Electron.")

            # Wait for the main data grid to be visible, indicating the app is ready
            grid_locator = page.locator('div[role="grid"]')
            expect(grid_locator).to_be_visible(timeout=45000)
            print("✅ Grille de données principale visible.")

            # Click the "Details" button on the first row
            details_button = page.get_by_role("button", name="Détails").first
            expect(details_button).to_be_enabled(timeout=15000)
            details_button.click()
            print("✅ Clic sur le bouton 'Détails'.")

            # Wait for the user dialog to appear
            dialog_locator = page.locator('div[role="dialog"]:has-text("Fiche Utilisateur")')
            expect(dialog_locator).to_be_visible(timeout=10000)
            print("✅ Dialogue 'Fiche Utilisateur' visible.")

            # Give it a second for final rendering
            time.sleep(1)

            # Take a screenshot
            screenshot_path = "jules-scratch/verification/user-info-card-final.png"
            dialog_locator.screenshot(path=screenshot_path)
            print(f"📸 Capture d'écran enregistrée dans {screenshot_path}")

        except Exception as e:
            print(f"❌ Erreur durant l'exécution du script Playwright: {e}")
            # Try to get a screenshot anyway
            if 'page' in locals():
                page.screenshot(path="jules-scratch/verification/error_screenshot.png")
                print("📸 Une capture d'écran de l'erreur a été prise.")
        finally:
            # We are connecting to an existing browser, so we don't close it.
            print("Script terminé.")


if __name__ == "__main__":
    main()
