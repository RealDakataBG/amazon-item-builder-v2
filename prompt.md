We have to create an app which will be uploaded to netlify afterwords and users of my company will. The app will create amazon listings concepts. Here are the details:

The app design needs to be light themed, modern ui. I'll upload an image to see the design. I want the app to be split in two sections - left narrow sidebar and right large working bar. The idea is to use the left sidebar to select and the right side to visualize the selection and edit the text inside.

The idea of the app is for the users/managers to create listings. On entering the project through the Netlify link, the users will be greeted with a menu, that will allow them to select which of our clients, they'll create a concept for. The menu should look modern, clean and should be pulled in that moment from this sheet, which we'll call the "Identifier Spreadsheet": https://docs.google.com/spreadsheets/d/1JCyL-0hvxqyyoJB-85oE5PXPoJnpIzSTC6v-YBx9zD8/edit?pli=1&gid=0#gid=0
This sheet contains 4 active columns with the headers: Name/Company(A column - name of the company/client), Identifier(B - the id of the client), Sheet ID(C - the google sheet ID whith all of the client's products), Drive Folder(D - the google drive URL of the client, where we keep all of their projects and products info).
The menu should show only the client names and id.
When the user selects the desired client, another window should open. This window will let the user select the product of that clients for which they want to create a concept for. The products which will be displayed on the second window, come from the spreadsheet from the column C in the Identifier Spreadsheet of that client.
Selecting a product in the second window of the app is basically telling in which sheet should the app be looking for info. We'll call the selected sheet "Products Sheet" for future refrence.

After the user selects a product, then the app will start working.

The app should pull the cells B2(Product Name), B3(amazon url of a competitor product), D6(Product Description), E6 (The Unique Selling Point of the product).
Then the next step for the app is to activate an apify scraper, here is the webhook for Apify:
    POST https://api.apify.com/v2/actor-tasks
    Content-Type : application/json
    Accept: application/json
    Authorization: Bearer <APIFY_API_KEY>
    @Apify_scraper_json.json
    
    The Apify json has 2 variables:
        {1} - this is the product name, taken from cell B2 from the Product Sheet. The name could contain some german special characters, which should be tramsformed to normal english letters, otherwise the Apify scraper won't start. After the name, place a random number between 1 and 1000, because there will be multiple variatons and we need to prevent duplications.
        {2} - this is the competitor amazon item, taken from cell B3 in the Product Sheet. This URL MUST start with https://, otherwise the scraper wont start. If it doesn't start with it, the app shoul add it automatically.

After the scrape is complete, the app continues. The app must wait for the apify scraper to finish and receive a webhook responce contaning information of the competitor product.

The next step of the app is to take the cell B1(Title Promot), B3(Bullets Prompt), B5(Description Prompt), B7(Keywords Prompt) from this spreadsheet and sheet (sheet name is "Text v2"): https://docs.google.com/spreadsheets/d/1rxuJKOQlUrQcLzuS-2yNnbOJtJqEM9I77YKAb7N1G-A/edit?gid=182936392#gid=182936392
We'll call this sheet "Prompt Sheet" for future refences.

These propmts, with combination of the some info we talked about previously, will create the concept of the product listing. The app then will procede to use Claude to create the Title, Bullet Points, Description and Backend Keywords of the product. The Claude version should be Sonnet 4.6. The app will generate the Title, Bullet Points and Description simultaneously with 3 different claude agents/modules which have 3 different system prompts:
    Title Claude:
        You are an expert Amazon listing copywriter specializing in product titles. When given product information and specifications, generate optimized Amazon product titles that are clear, keyword-rich, and conversion-focused.
        Return only the title. No explanation or commentary unless asked.
    Bullet Points Claude:
        You are an expert Amazon listing copywriter specializing in product bullet points. When given product information and specifications, write compelling bullet points that highlight key features and benefits in a clear, conversion-focused way.
        Return only the bullet points. No explanation or commentary unless asked.
    Description Claude:
        You are an expert Amazon listing copywriter specializing in product descriptions. When given product information and specifications, write an engaging product description that informs, persuades, and converts browsers into buyers.
        Return only the description. No explanation or commentary unless asked.
The app will wait for these 3 to finish generating and returning a webhook response to the app before continuing to launch the last Claude agent/module:
    Backend Keywords Claude:
        You are an expert Amazon listing copywriter specializing in backend search keywords. When given product information and specifications, generate a comprehensive set of relevant search keywords optimized for Amazon's search algorithm.
        Return only the keywords. No explanation or commentary unless asked.

The app will feed the each claude agent/module with their respected prompt from the Prompt Sheet + additional information, here are the "user" prompts for each claude agent:
    Title Claude User Prompt:
        - {Cell_B1_from_the_Prompt_Sheet}
        - Hier findest du die Infos zum dem Produkt um das es geht: Produktname: {cell_B1_from_Product_Sheet}, Beschreibung des Produktes: {cell_D6_from_Product_Sheet}, Alleinstellungsmerkmale: {cell_E6_from_Product_Sheet}
        - Dies sind Rezensionen von Konkurrenzprodukten. Analysieren Sie diese und identifizieren Sie die häufigsten Kritikpunkte. Nutzen Sie diese wiederkehrenden Punkte, um Probleme aufzuzeigen, die bei unserem Produkt nicht auftreten – jedoch nur, wenn dies anhand der von mir bereitgestellten Produktinformationen faktisch korrekt ist. Erfinden Sie keine Vorteile oder Funktionen.
        Hier sind die Rezensionen der Konkurrenzprodukte: {15_ratings_from_the_apify_scrape}
        - Gibt mir jetzt den Titel aus.
    Bullet Points CLaude User Prompt:
        - {Cell_B3_from_the_Prompt_Sheet}
        - Hier findest du die Infos zum dem Produkt um das es geht: Produktname: {cell_B1_from_Product_Sheet}, Beschreibung des Produktes: {cell_D6_from_Product_Sheet}, Alleinstellungsmerkmale: {cell_E6_from_Product_Sheet}
        - Wichtig: Benutze keine Sternchen (*) oder ** im Text und schreibe nichts fett / dick. Es soll also nirgendwo z.B. "**Wort**" stehen.
    Description Claude User Prompt:
        - {Cell_B5_from_the_Prompt_Sheet}
        - Hier findest du die Infos zum dem Produkt um das es geht: Produktname: {cell_B1_from_Product_Sheet}, Beschreibung des Produktes: {cell_D6_from_Product_Sheet}, Alleinstellungsmerkmale: {cell_E6_from_Product_Sheet}
        - Nutze die folgenden Rezensionen eines Mitbewerberprodukts, um relevante Kundenbedürfnisse und Kritikpunkte zu identifizieren.
            1. Analyse
            - Ermittele, welche Eigenschaften des Mitbewerberprodukts häufig gelobt werden.
            - Ermittele, welche Punkte häufig kritisiert werden.
            2. Umsetzung in der Produktbeschreibung
            - Nutze diese Erkenntnisse für die Beschreibung unseres Produkts.
            - Verwende ausschließlich echte Eigenschaften und Spezifikationen unseres Produkts (keine erfundenen Vorteile oder Funktionen).
            - Hebe gezielt die Stärken hervor, die für Kunden wichtig sind.
            - Zeige, wo unser Produkt mögliche Schwächen des Mitbewerbers ausgleicht (nur wenn dies tatsächlich zutrifft).
            3. Ziel
            - Schreibe eine Beschreibung, die die wichtigsten Kundenbedürfnisse anspricht.
            - Baue Vertrauen auf, indem du konkret auf Wünsche und Bedenken der Kunden eingehst.
        - Hier folgen die Rezensionen: {15_ratings_from_the_apify_scrape}
        - Wichtig: Benutze keine Sternchen (*) oder ** im Text und schreibe nichts fett / dick. Es soll also nirgendwo z.B. "**Wort**" stehen.
    Backend Keywords Claude User Prompt:
        - Hier sind die Bulletpoints, Titel und die Beschreibung des Produkts:
            - Title: {result_of_title_claude_user_prompt}
            - Bullet Points: {result_of_bullet_points_claude_user_prompt}
            - Description: {result_of_description_claude_user_prompt}
            - {Cell_B7_from_the_Prompt_Sheet}

After all the Claude agents/modules are finshed, the app needs to format all the inputs (user prompts) and outputs of them and display them in the app. On the left narrow sidebar we should see Text, Bullet Points, Description, Backend Keywords and when one is clickedm, the right large side should open the Input and Output of the respected option in an editable text area.

Ask me question if you need additional information and let's plan this app out!