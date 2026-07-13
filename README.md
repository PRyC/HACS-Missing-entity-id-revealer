# Show IDs of missing entities

When a Lovelace card cannot find an entity, instead of just **"Entity not found"** / **"Nie znaleziono encji"**, it appends the **entity ID** to the message.

**Before:** `Entity not found`

**After:** `Entity not found: sensor.temperature_living_room`

## Installation via HACS

1. Make sure [HACS](https://hacs.xyz/) is installed
2. Go to **HACS → Frontend**
3. Click three dots in the top right corner → **Custom repositories**
4. Enter the repository URL (https://github.com/PRyC/HACS-Missing-entity-id-revealer/) and select category **Lovelace / Dashboard**
5. Click **Add**
6. Find **Entity ID Revealer** in the list and click **Download**
7. **Refresh** the browser (hard refresh: Ctrl+F5 / Cmd+Shift+R)

## Manual installation

1. Download `entity-id-revealer.js`
2. Place it in your `config/www/` directory (create if it doesn't exist)
3. Go to **Settings → Dashboards → Resources**
4. Add resource: `/local/entity-id-revealer.js` as **JavaScript Module**
5. **Refresh** the browser

## How it works

The script silently observes the Lovelace interface for warning elements (`hui-warning`, `hui-warning-element`). When a warning appears (or its text gets reset by a panel reload), the script:

1. Walks up the DOM tree
2. Finds the parent component's `_config.entity` property containing the entity ID
3. Modifies the warning text, appending the entity ID

## Supported languages

Detects "not found" messages in: English, Polish, German, French, Spanish, Italian, Portuguese, Russian, Chinese.

## License

MIT
