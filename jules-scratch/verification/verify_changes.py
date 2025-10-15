from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Se connecter à l'application
        page.goto("http://localhost:3000", timeout=30000)

        # Attendre que la page de connexion soit chargée et sélectionner un technicien
        expect(page.get_by_text("Sélectionnez votre profil technicien")).to_be_visible(timeout=20000)
        page.get_by_role("button", name="Kevin BIVIA").click()

        # Entrer le mot de passe et se connecter
        expect(page.get_by_label("Mot de passe")).to_be_visible()
        page.get_by_label("Mot de passe").fill("password")
        page.get_by_role("button", name="Se connecter").click()

        # Attendre que le tableau de bord se charge
        expect(page.get_by_text("Bonjour, Kevin BIVIA !")).to_be_visible(timeout=15000)

        # 2. Vérifier la page des sessions RDS
        # Naviguer vers la page des sessions en cliquant sur le lien dans la barre latérale
        page.get_by_role("link", name="Sessions RDS").click()

        # Attendre que le tableau des sessions soit visible
        expect(page.get_by_role("heading", name="Sessions RDS")).to_be_visible()

        # Vérifier la présence des nouvelles colonnes
        expect(page.get_by_role("columnheader", name="Durée Session")).to_be_visible()
        expect(page.get_by_role("columnheader", name="Heure Connexion")).to_be_visible()

        # Prendre une capture d'écran de la page des sessions
        page.screenshot(path="jules-scratch/verification/sessions_page_verification.png")
        print("Screenshot of Sessions Page taken.")

        # 3. Vérifier la page de gestion des utilisateurs
        # Naviguer vers la page de gestion des utilisateurs
        page.get_by_role("link", name="Utilisateurs").click()

        # Attendre que la page se charge et vérifier le titre
        expect(page.get_by_role("heading", name="Gestion Utilisateurs")).to_be_visible()

        # Prendre une capture d'écran de la page des utilisateurs
        page.screenshot(path="jules-scratch/verification/users_page_verification.png")
        print("Screenshot of Users Management Page taken.")

        print("Verification script completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)