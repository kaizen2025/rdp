
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        # Connect to the running Electron app
        browser = await p.chromium.connect_over_cdp("http://localhost:9222")
        context = browser.contexts[0]
        page = context.pages[0]

        try:
            # Wait for the main table to be visible
            await expect(page.locator('div[role="grid"]')).to_be_visible(timeout=30000)
            print("✅ Table des sessions RDS visible.")

            # Find the first "Details" button and click it
            details_button = page.get_by_role("button", name="Détails").first
            await expect(details_button).to_be_enabled(timeout=10000)
            await details_button.click()
            print("✅ Bouton 'Détails' cliqué.")

            # Wait for the User Info Dialog to appear
            dialog_title = page.get_by_text("Fiche Utilisateur")
            await expect(dialog_title).to_be_visible(timeout=10000)
            print("✅ Fiche Utilisateur ouverte.")

            # Take a screenshot of the dialog
            dialog_selector = "div[role='dialog']"
            dialog_element = page.locator(dialog_selector).first
            await dialog_element.screenshot(path="jules-scratch/verification/user-info-card.png")
            print("📸 Capture d'écran prise avec succès.")

        except Exception as e:
            print(f"❌ Une erreur est survenue : {e}")
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
            print("📸 Capture d'écran de l'erreur prise.")
        finally:
            # The browser is controlled by the external process, so we don't close it.
            # We just close the connection.
            await browser.close()
            print("Connexion au navigateur fermée.")


if __name__ == "__main__":
    asyncio.run(main())
