// Store all protomon data
let protomonData = [];
let biomeData = {
    'Forest': { priests: [], devotees: [] },
    'Frost': { priests: [], devotees: [] },
    'Desert': { priests: [], devotees: [] },
    'Swamp': { priests: [], devotees: [] },
    'Prairie': { priests: [], devotees: [] }
};

// Stella Fervor Data - Devotees
// Star 3 devotees use a dedicated lookup (stella 3 is skipped entirely)
const STAR_3_DEVOTEE_FERVOR = {
    '3.1.1': 3, '3.1.2': 3, '3.1.3': 3, '3.1.4': 3, '3.1.5': 3, '3.1.6': 12,
    '3.2.1': 3, '3.2.2': 3, '3.2.3': 3, '3.2.4': 3, '3.2.5': 3, '3.2.6': 0,
    '3.4.1': 3, '3.4.2': 3, '3.4.3': 3, '3.4.4': 3, '3.4.5': 3, '3.4.6': 18,
    '3.5.1': 3, '3.5.2': 3, '3.5.3': 3, '3.5.4': 3, '3.5.5': 3, '3.5.6': 0
};

// Lookup table for milestone bonuses at .6 and .12 positions
const DEVOTEE_MILESTONE_BONUSES = {
    '4.2.6': 18,
    '4.2.12': 24,
    '4.6.6': 24,
    '4.6.12': 30,
    '4.10.6': 30,
    '4.10.12': 36,
    '5.2.6': 36,
    '5.2.12': 42,
    '5.6.6': 42,
    '5.6.12': 48,
    '6.1.6': 54,
    '6.1.12': 60,
    '6.6.12': 54,
    '6.7.6': 60,
    '6.7.12': 66
};

// Priest fervor uses a different calculation system (not a lookup table)
// Priests gain fervor at specific tier positions:
// - Star 3: Only tier 3 gives fervor (75)
// - Star 4+: Tiers 3 and 9 give fervor (100, 125, 150, etc.)
// Formula: 25 * star level

// Base Fervor - Starting fervor based on star level
const BASE_FERVOR = {
    Devotee: {
        1: 0,
        2: 5,
        3: 25,
        4: 127,
        5: 661,
        6: 1543,
        7: 4411
    },
    Priest: {
        1: 0,
        2: 25,
        3: 125,
        4: 725,
        5: 2825,
        6: 6125,
        7: 22925
    }
};

// Fervor gained per level based on rarity
const RARITY_LEVEL_GAIN = {
    Devotee: {
        'SSS': 50,
        'SS': 45,
        'S': 40,
        'Purple': 35,
        'Blue': 30
    },
    Priest: {
        'SSS': 250,
        'SS': 225,
        'S': 200,
        'Purple': 175,
        'Blue': 0 // N/A for priests
    }
};

// LocalStorage keys
const LAYOUT_KEY = 'protomonLayout';
const STATS_KEY = 'protomonStats';
const DISABLED_KEY = 'protomonDisabled';

// Flag to prevent saving during data load
let isLoading = false;

// Load data from JSON file when page loads
window.addEventListener('DOMContentLoaded', function() {
    // Clamp number inputs to their min/max when typing
    document.addEventListener('input', function(e) {
        if (e.target.type === 'number' && e.target.max) {
            const max = parseInt(e.target.max);
            const min = parseInt(e.target.min) || 0;
            if (e.target.value !== '' && parseInt(e.target.value) > max) {
                e.target.value = max;
            }
            if (e.target.value !== '' && parseInt(e.target.value) < min) {
                e.target.value = min;
            }
        }
    });

    fetch('../base_protomon.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            protomonData = data;

            // Filter out empty entries and organize by biome and role
            protomonData.forEach(protomon => {
                if (protomon.Name && protomon.Biome && protomon.Role) {
                    if (biomeData[protomon.Biome]) {
                        if (protomon.Role === 'Priest') {
                            biomeData[protomon.Biome].priests.push(protomon);
                        } else if (protomon.Role === 'Devotee') {
                            biomeData[protomon.Biome].devotees.push(protomon);
                        }
                    }
                }
            });

            // Initialize all biome selectors
            initializeBiomeSelectors();

            // Load saved data from localStorage
            loadSavedData();
        })

        .catch(error => {
            console.error('Error loading JSON:', error);
            showError('Error loading data - try using a local web server');
        });
});

// Initialize all biome selectors
function initializeBiomeSelectors() {
    const biomeSections = document.querySelectorAll('.biome-section');

    biomeSections.forEach(section => {
        const biome = section.getAttribute('data-biome');
        if (!biome || !biomeData[biome]) return;

        // Initialize priest selector
        const priestSelect = section.querySelector('.priest-select');
        populateSelect(priestSelect, biomeData[biome].priests);

        // Initialize devotee selectors
        const devoteeSelects = section.querySelectorAll('.devotee-select');
        devoteeSelects.forEach(select => {
            populateSelect(select, biomeData[biome].devotees);
        });

        // Add change listeners for duplicate prevention
        addChangeListeners(section);

        // Add change listeners for saving data
        addSaveListeners(section);

        // Add disable/enable toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'biome-toggle-btn';
        toggleBtn.textContent = 'Disable';
        toggleBtn.addEventListener('click', () => toggleBiome(section, toggleBtn));
        section.appendChild(toggleBtn);
    });
}

// Populate a select element with protomon options
function populateSelect(selectElement, monsArray) {
    // Add blank option
    const blankOption = document.createElement('option');
    blankOption.value = '';
    blankOption.textContent = '- - None - -';
    selectElement.appendChild(blankOption);

    // Add all mons as options
    monsArray.forEach(mon => {
        const option = document.createElement('option');
        option.value = mon.Name;
        option.textContent = mon.Name;
        option.dataset.rarity = mon.Rarity;
        option.dataset.adapt = mon.Adapt;
        option.dataset.gloryMulti = mon['Glory Multi'];
        option.dataset.lvlGain = mon['Lvl Gain'];
        selectElement.appendChild(option);
    });
}

// Populate stella options based on star level
function populateStellaOptions(stellaSelect, starLevel) {
    stellaSelect.innerHTML = '';

    // Add placeholder option (visible when no real options or nothing selected)
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'S.T';
    placeholder.disabled = true;
    placeholder.selected = true;
    stellaSelect.appendChild(placeholder);

    if (!starLevel) return;

    // Hide placeholder from dropdown when real options exist
    placeholder.hidden = true;

    // Star 1-2 have no real stella tiers, just show a default 1.0
    if (starLevel < 3) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '1.0';
        defaultOption.textContent = '1.0';
        stellaSelect.appendChild(defaultOption);
        stellaSelect.value = '1.0';
        return;
    }

    const stellaCounts = { 3: 5, 4: 12, 5: 12, 6: 18, 7: 18, 8: 18 };
    const maxStella = stellaCounts[starLevel] || 12;

    for (let stella = 1; stella <= maxStella; stella++) {
        const maxTier = getMaxTierForStella(starLevel, stella);
        for (let tier = 0; tier <= maxTier; tier++) {
            const option = document.createElement('option');
            option.value = `${stella}.${tier}`;
            option.textContent = `${stella}.${tier}`;
            stellaSelect.appendChild(option);
        }
    }

    if (!stellaSelect.value) {
        stellaSelect.value = '1.0';
    }
}

// Update select background color based on selected protomon's rarity
function updateSelectRarityColor(select) {
    select.classList.remove('rarity-sss', 'rarity-ss', 'rarity-s', 'rarity-purple', 'rarity-blue');
    const selectedOption = select.options[select.selectedIndex];
    const rarity = selectedOption?.dataset?.rarity;
    if (rarity) {
        select.classList.add(`rarity-${rarity.toLowerCase()}`);
    }
}

// Add change listeners to prevent duplicates using event delegation
function addChangeListeners(section) {
    section.addEventListener('change', function(event) {
        if (event.target.classList.contains('mon-select')) {
            updateSelectOptions(section);
        }
    });
}

// Update all select options to disable duplicates
function updateSelectOptions(section) {
    const allSelects = section.querySelectorAll('.mon-select');
    const selectedValues = new Set();

    // Collect all selected values (excluding blank)
    allSelects.forEach(select => {
        if (select.value) {
            selectedValues.add(select.value);
        }
    });

    // Update each select to disable already-selected options
    allSelects.forEach(select => {
        const currentValue = select.value;
        const options = select.querySelectorAll('option');

        options.forEach(option => {
            if (option.value === '') {
                // Always enable blank option
                option.disabled = false;
            } else if (option.value === currentValue) {
                // Always enable the currently selected value
                option.disabled = false;
            } else if (selectedValues.has(option.value)) {
                // Disable if selected elsewhere
                option.disabled = true;
            } else {
                // Enable if not selected
                option.disabled = false;
            }
        });
    });
}

// Toggle a biome section between enabled and disabled
function toggleBiome(section, btn) {
    const isNowDisabled = section.classList.toggle('biome-disabled');
    btn.textContent = isNowDisabled ? 'Enable' : 'Disable';

    if (isNowDisabled) {
        section.querySelectorAll('select, input').forEach(el => el.disabled = true);
    } else {
        // Re-enable selects; only re-enable stat inputs for rows that have a mon selected
        section.querySelectorAll('.mon-row').forEach(row => {
            const monSelect = row.querySelector('.mon-select');
            monSelect.disabled = false;
            const hasSelection = monSelect && monSelect.value;
            row.querySelectorAll('.star-input, .level-input, .stella-input').forEach(input => {
                input.disabled = !hasSelection;
            });
        });
    }

    updateEfficiencyIndicators();
    saveDisabledState();
}

// Save which biomes are currently disabled
function saveDisabledState() {
    const disabled = [];
    document.querySelectorAll('.biome-section.biome-disabled').forEach(section => {
        disabled.push(section.getAttribute('data-biome'));
    });
    localStorage.setItem(DISABLED_KEY, JSON.stringify(disabled));
}

// Function to show error message
function showError(message) {
    const sections = document.querySelectorAll('.biome-section');
    sections.forEach(section => {
        const container = section.querySelector('.selector-container');
        if (container) {
            container.innerHTML = `<p style="text-align: center; color: red;">${message}</p>`;
        }
    });
}

// Add event listeners to save data on change
function addSaveListeners(section) {
    const allRows = section.querySelectorAll('.mon-row');

    allRows.forEach(row => {
        const select = row.querySelector('.mon-select');
        const starInput = row.querySelector('.star-input');
        const levelInput = row.querySelector('.level-input');
        const stellaSelect = row.querySelector('.stella-input');

        // Create and add fervor display element
        const fervorDisplay = document.createElement('span');
        fervorDisplay.className = 'fervor-display';
        fervorDisplay.textContent = '';
        fervorDisplay.style.display = 'none';
        row.appendChild(fervorDisplay);

        // Create efficiency indicator (green arrow = best lith efficiency, red X = not best)
        const efficiencyIndicator = document.createElement('span');
        efficiencyIndicator.className = 'efficiency-indicator';
        efficiencyIndicator.style.display = 'none';
        row.appendChild(efficiencyIndicator);

        // Determine role (Priest or Devotee) based on parent selector
        const isPriest = row.closest('.priest-selector') !== null;
        const role = isPriest ? 'Priest' : 'Devotee';

        // Function to update fervor display
        const updateFervorDisplay = () => {
            const starLevel = parseInt(starInput.value);
            const level = parseInt(levelInput.value) || 0;
            const stellaValue = stellaSelect.value.trim();
            // Prepend star level to stella value to make full stella tier (e.g., "1.6" -> "3.1.6")
            const stellaTier = stellaValue ? `${starLevel}.${stellaValue}` : '';
            const selectedOption = select.options[select.selectedIndex];
            const rarity = selectedOption?.dataset?.rarity || '';
            const gloryMulti = parseFloat(selectedOption?.dataset?.gloryMulti) || 1;

            if (starLevel && select.value) {
                // Calculate individual components
                const baseFervor = BASE_FERVOR[role]?.[starLevel] || 0;
                const rarityGain = RARITY_LEVEL_GAIN[role]?.[rarity] || 0;
                const levelFervor = level * rarityGain;
                const stellaFervor = getStellaFervorUpToTier(starLevel, stellaTier, role);
                const isSixStarUpgraded = (starLevel >= 6) && (rarity === 'SS' || rarity === 'SSS');
                const sixStarBonus = isSixStarUpgraded ? (level * (role === 'Priest' ? 50 : 10)) : 0;
                const subtotal = baseFervor + levelFervor + stellaFervor + sixStarBonus;
                const priestFervor = Math.floor(subtotal * gloryMulti);
                const lithCost = calculateLithCost(level)
                const fervorUpgrade = calculateFervorUpgrade(subtotal, rarityGain, gloryMulti, priestFervor, starLevel, role, rarity)

                // For priests, add all devotee fervor from the same biome
                let totalFervor = priestFervor;
                const atMax = level >= (parseInt(levelInput.max) || 250);
                let tooltipText = atMax ? '' : `Lith Cost: ${lithCost}\nNext Upgrade: ${fervorUpgrade}\n\n`;
                tooltipText += `Base: ${baseFervor}\nLevel (${level} × ${rarityGain}): ${levelFervor}\nStella (${stellaTier || 'none'}): ${stellaFervor}`;
                if (sixStarBonus > 0) tooltipText += `\n6★ Bonus (${level} × ${role === 'Priest' ? 50 : 10}): ${sixStarBonus}`;
                tooltipText += `\nSubtotal: ${subtotal}\nGlory (${subtotal} × ${gloryMulti}): ${priestFervor}`;

                if (isPriest) {
                    const biomeSection = row.closest('.biome-section');
                    const devoteFervor = calculateBiomeDevoteeFervor(biomeSection);
                    totalFervor = priestFervor + devoteFervor;
                    tooltipText += `\n\nDevotees: ${devoteFervor}\nTotal: ${totalFervor}`;
                }

                fervorDisplay.innerHTML = `<span class="fervor-glory">${totalFervor}</span>`;
                fervorDisplay.title = tooltipText;
                fervorDisplay.style.display = 'flex';
                fervorDisplay.dataset.lithCost = lithCost;
                fervorDisplay.dataset.fervorUpgrade = fervorUpgrade;

                // If this is a devotee, update the priest fervor as well
                if (!isPriest) {
                    const biomeSection = row.closest('.biome-section');
                    updatePriestFervorInBiome(biomeSection);
                }
            } else {
                fervorDisplay.innerHTML = '';
                fervorDisplay.title = '';
                fervorDisplay.style.display = 'none';
                delete fervorDisplay.dataset.lithCost;
                delete fervorDisplay.dataset.fervorUpgrade;
            }
            updateEfficiencyIndicators();
        };

        // Add hidden placeholder to star input (shows as display text but not in dropdown)
        const starPlaceholder = document.createElement('option');
        starPlaceholder.value = '';
        starPlaceholder.textContent = '★';
        starPlaceholder.disabled = true;
        starPlaceholder.hidden = true;
        starPlaceholder.selected = true;
        starInput.prepend(starPlaceholder);

        // Set initial placeholder and disable inputs
        populateStellaOptions(stellaSelect);
        starInput.value = '';
        starInput.disabled = true;
        levelInput.disabled = true;
        stellaSelect.disabled = true;

        // When a Protomon is selected, load its saved stats
        select.addEventListener('change', () => {
            // Don't process if we're loading saved data
            if (!isLoading) {
                const monName = select.value;
                if (monName) {
                    // Load this protomon's saved stats
                    const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
                    const monStats = stats[monName] || { star: 1, level: 1, stella: '' };
                    const selectedOpt = select.options[select.selectedIndex];
                    const monRarity = selectedOpt?.dataset?.rarity || '';
                    starInput.value = monStats.star || 1;
                    updateStarOptions(starInput, monRarity);
                    levelInput.value = monStats.level || 1;

                    // Populate stella options based on star level
                    const starLevel = parseInt(starInput.value);
                    populateStellaOptions(stellaSelect, starLevel);
                    if (starLevel >= 3) {
                        stellaSelect.value = monStats.stella || '1.0';
                    }

                    // Enable inputs when a protomon is selected
                    starInput.disabled = false;
                    levelInput.disabled = false;
                    stellaSelect.disabled = starLevel >= getMaxStarForRarity(monRarity);
                    levelInput.max = getMaxLevel(parseInt(starInput.value), role);
                    updateSelectRarityColor(select);
                } else {
                    // Clear and disable inputs if no mon selected
                    starInput.value = '';
                    levelInput.value = '';
                    populateStellaOptions(stellaSelect);
                    updateSelectRarityColor(select);
                    starInput.disabled = true;
                    levelInput.disabled = true;
                    stellaSelect.disabled = true;
                }
                updateFervorDisplay();
                saveLayout();
            }
        });

        // Save star/level/stella changes for the current Protomon
        starInput.addEventListener('change', () => {
            const starLevel = parseInt(starInput.value);
            if (starLevel && starLevel >= 3) {
                // Repopulate stella options when star level changes
                const currentStella = stellaSelect.value;
                populateStellaOptions(stellaSelect, starLevel);
                // Try to restore the previous stella selection if valid
                if (currentStella && stellaSelect.querySelector(`option[value="${currentStella}"]`)) {
                    stellaSelect.value = currentStella;
                } else {
                    stellaSelect.value = '1.0';
                }
            } else {
                populateStellaOptions(stellaSelect);
            }
            // Disable stella at max star for this protomon's rarity
            if (select.value) {
                const selectedOpt = select.options[select.selectedIndex];
                const monRarity = selectedOpt?.dataset?.rarity || '';
                stellaSelect.disabled = starLevel >= getMaxStarForRarity(monRarity);
            }
            // Update level cap based on new star level
            const maxLvl = getMaxLevel(starLevel, role);
            levelInput.max = maxLvl;
            if (parseInt(levelInput.value) > maxLvl) levelInput.value = maxLvl;
            saveMonData(row);
            updateFervorDisplay();
        });
        levelInput.addEventListener('input', () => {
            saveMonData(row);
            updateFervorDisplay();
        });
        stellaSelect.addEventListener('change', () => {
            saveMonData(row);
            updateFervorDisplay();
        });

    });
}

// Global scroll wheel support - works anywhere on page when a level-input is focused
document.addEventListener('wheel', (event) => {
    const input = document.activeElement;
    if (!input || !input.classList.contains('level-input') || input.disabled) return;
    event.preventDefault();

    const currentValue = parseInt(input.value) || 0;
    const min = parseInt(input.min) || 0;
    const max = parseInt(input.max) || Infinity;
    const delta = event.deltaY < 0 ? 1 : -1;

    // If empty and scrolling down, do nothing
    if (input.value === '' && delta === -1) return;

    // If value is 1 and scrolling down, clear the input
    if (currentValue === 1 && delta === -1) {
        return;
    } else {
        input.value = Math.max(min, Math.min(max, currentValue + delta));
    }

    // Trigger existing input listeners for save and fervor update
    input.dispatchEvent(new Event('input'));
}, { passive: false });

// Save a specific Protomon's star/level/stella data
function saveMonData(row) {
    const select = row.querySelector('.mon-select');
    const starInput = row.querySelector('.star-input');
    const levelInput = row.querySelector('.level-input');
    const stellaSelect = row.querySelector('.stella-input');

    const monName = select.value;
    if (!monName) return; // Don't save if no mon selected

    const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {};

    stats[monName] = {
        star: parseInt(starInput.value) || 0,
        level: parseInt(levelInput.value) || 0,
        stella: stellaSelect?.value || ''
    };

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Save the layout (which protomon is in which slot)
function saveLayout() {
    const layout = {};
    const biomeSections = document.querySelectorAll('.biome-section');

    biomeSections.forEach(section => {
        const biome = section.getAttribute('data-biome');
        if (!biome) return;

        layout[biome] = {
            priest: '',
            devotees: []
        };

        // Save priest selection
        const priestRow = section.querySelector('.priest-selector .mon-row');
        if (priestRow) {
            const select = priestRow.querySelector('.mon-select');
            layout[biome].priest = select.value || '';
        }

        // Save devotees selections
        const devoteeRows = section.querySelectorAll('.devotees-selector .mon-row');
        devoteeRows.forEach(row => {
            const select = row.querySelector('.mon-select');
            layout[biome].devotees.push(select.value || '');
        });
    });

    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

// Load saved data from localStorage
function loadSavedData() {
    isLoading = true;

    const layout = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {};
    const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
    const biomeSections = document.querySelectorAll('.biome-section');

    biomeSections.forEach(section => {
        const biome = section.getAttribute('data-biome');
        if (!biome || !layout[biome]) return;

        // Load priest
        const priestRow = section.querySelector('.priest-selector .mon-row');
        if (priestRow && layout[biome].priest) {
            const monName = layout[biome].priest;
            setRowSelection(priestRow, monName, stats[monName] || { star: 0, level: 0 });
        }

        // Load devotees
        const devoteeRows = section.querySelectorAll('.devotees-selector .mon-row');
        devoteeRows.forEach((row, index) => {
            const monName = layout[biome].devotees[index] || '';
            if (monName) {
                setRowSelection(row, monName, stats[monName] || { star: 0, level: 0 });
            }
        });

        // Update select options after loading to prevent duplicates
        updateSelectOptions(section);
    });

    isLoading = false;

    // After all data is loaded, update priest fervor displays to include devotee totals
    biomeSections.forEach(section => {
        updatePriestFervorInBiome(section);
    });

    // Restore disabled biome state
    const disabledBiomes = JSON.parse(localStorage.getItem(DISABLED_KEY)) || [];
    if (disabledBiomes.length > 0) {
        biomeSections.forEach(section => {
            const biome = section.getAttribute('data-biome');
            if (disabledBiomes.includes(biome)) {
                section.classList.add('biome-disabled');
                section.querySelectorAll('select, input').forEach(el => el.disabled = true);
                const btn = section.querySelector('.biome-toggle-btn');
                if (btn) btn.textContent = 'Enable';
            }
        });
    }

    updateEfficiencyIndicators();
}

// Set selection and stats for a single row
function setRowSelection(row, monName, monStats) {
    const select = row.querySelector('.mon-select');
    const starInput = row.querySelector('.star-input');
    const levelInput = row.querySelector('.level-input');
    const stellaSelect = row.querySelector('.stella-input');
    const fervorDisplay = row.querySelector('.fervor-display');

    select.value = monName || '';
    updateSelectRarityColor(select);
    const loadedOpt = select.options[select.selectedIndex];
    const loadedRarity = loadedOpt?.dataset?.rarity || '';
    starInput.value = monStats.star || '1';
    updateStarOptions(starInput, loadedRarity);
    levelInput.value = monStats.level || '';

    // Populate stella options and set value
    if (stellaSelect) {
        populateStellaOptions(stellaSelect, monStats.star);
        if (monStats.star && monStats.star >= 3) {
            stellaSelect.value = monStats.stella || '1.0';
        }
    }

    // Enable inputs only if a protomon is selected
    starInput.disabled = !monName;
    levelInput.disabled = !monName;
    if (stellaSelect) {
        stellaSelect.disabled = !monName || (monStats.star || 0) >= getMaxStarForRarity(loadedRarity);
    }
    const loadRole = row.closest('.priest-selector') ? 'Priest' : 'Devotee';
    levelInput.max = getMaxLevel(monStats.star, loadRole);

    // Update fervor display
    if (fervorDisplay && monName && monStats.star) {
        const selectedOption = select.options[select.selectedIndex];
        const rarity = selectedOption?.dataset?.rarity || '';
        const gloryMulti = parseFloat(selectedOption?.dataset?.gloryMulti) || 1;
        const isPriest = row.closest('.priest-selector') !== null;
        const role = isPriest ? 'Priest' : 'Devotee';
        // Prepend star level to stella value
        const stellaTier = monStats.stella ? `${monStats.star}.${monStats.stella}` : '';

        // Calculate individual components for tooltip
        const baseFervor = BASE_FERVOR[role]?.[monStats.star] || 0;
        const rarityGain = RARITY_LEVEL_GAIN[role]?.[rarity] || 0;
        const level = monStats.level || 0;
        const levelFervor = level * rarityGain;
        const stellaFervor = getStellaFervorUpToTier(monStats.star, stellaTier, role);
        const isSixStarUpgraded = (monStats.star >= 6) && (rarity === 'SS' || rarity === 'SSS');
        const sixStarBonus = isSixStarUpgraded ? (level * (role === 'Priest' ? 50 : 10)) : 0;
        const subtotal = baseFervor + levelFervor + stellaFervor + sixStarBonus;
        const devoteeOrPriestFervor = Math.floor(subtotal * gloryMulti);
        const lithCost = calculateLithCost(level);
        const fervorUpgrade = calculateFervorUpgrade(subtotal, rarityGain, gloryMulti, devoteeOrPriestFervor, monStats.star, role, rarity)

        // For devotees during initial load, just show their own fervor
        // For priests, don't calculate devotee totals yet (they haven't loaded)
        // The devotees will trigger priest updates when they load
        fervorDisplay.innerHTML = `<span class="fervor-glory">${devoteeOrPriestFervor}</span>`;
        const atMax = level >= (parseInt(levelInput.max) || 250);
        let tooltipText = atMax ? '' : `Lith Cost: ${lithCost}\nNext Upgrade: ${fervorUpgrade}\n\n`;
        tooltipText += `Base: ${baseFervor}\nLevel (${level} × ${rarityGain}): ${levelFervor}\nStella (${stellaTier || 'none'}): ${stellaFervor}`;
        if (sixStarBonus > 0) tooltipText += `\n6★ Bonus (${level} × ${role === 'Priest' ? 50 : 10}): ${sixStarBonus}`;
        tooltipText += `\nSubtotal: ${subtotal}\nGlory (${subtotal} × ${gloryMulti}): ${devoteeOrPriestFervor}`;
        fervorDisplay.title = tooltipText;
        fervorDisplay.style.display = 'flex';
        fervorDisplay.dataset.lithCost = lithCost;
        fervorDisplay.dataset.fervorUpgrade = fervorUpgrade;
    } else if (fervorDisplay) {
        fervorDisplay.innerHTML = '';
        fervorDisplay.title = '';
        fervorDisplay.style.display = 'none';
        delete fervorDisplay.dataset.lithCost;
        delete fervorDisplay.dataset.fervorUpgrade;
    }
}

// =============== BIOME FERVOR CALCULATION ===============

/**
 * Update priest fervor display in a biome (since it depends on devotee totals)
 * @param {HTMLElement} biomeSection - The biome section element
 */
function updatePriestFervorInBiome(biomeSection) {
    const priestRow = biomeSection.querySelector('.priest-selector .mon-row');
    if (!priestRow) return;

    const select = priestRow.querySelector('.mon-select');
    const starInput = priestRow.querySelector('.star-input');
    const levelInput = priestRow.querySelector('.level-input');
    const stellaSelect = priestRow.querySelector('.stella-input');
    const fervorDisplay = priestRow.querySelector('.fervor-display');

    const monName = select?.value;
    if (!monName) return;

    const starLevel = parseInt(starInput?.value);
    const level = parseInt(levelInput?.value) || 0;
    const stellaValue = stellaSelect?.value?.trim() || '';
    const stellaTier = stellaValue ? `${starLevel}.${stellaValue}` : '';
    const selectedOption = select.options[select.selectedIndex];
    const rarity = selectedOption?.dataset?.rarity || '';
    const gloryMulti = parseFloat(selectedOption?.dataset?.gloryMulti) || 1;

    if (starLevel && fervorDisplay) {
        const baseFervor = BASE_FERVOR['Priest']?.[starLevel] || 0;
        const rarityGain = RARITY_LEVEL_GAIN['Priest']?.[rarity] || 0;
        const levelFervor = level * rarityGain;
        const stellaFervor = getStellaFervorUpToTier(starLevel, stellaTier, 'Priest');
        const isSixStarUpgraded = (starLevel >= 6) && (rarity === 'SS' || rarity === 'SSS');
        const sixStarBonus = isSixStarUpgraded ? (level * 50) : 0;
        const subtotal = baseFervor + levelFervor + stellaFervor + sixStarBonus;
        const priestFervor = Math.floor(subtotal * gloryMulti);
        const devoteFervor = calculateBiomeDevoteeFervor(biomeSection);
        const totalFervor = priestFervor + devoteFervor;
        const lithCost = calculateLithCost(level);
        const fervorUpgrade = calculateFervorUpgrade(subtotal, rarityGain, gloryMulti, priestFervor, starLevel, 'Priest', rarity)

        const atMax = level >= (parseInt(levelInput?.max) || 250);
        let tooltipText = atMax ? '' : `Lith Cost: ${lithCost}\nNext Upgrade: ${fervorUpgrade}\n\n`;
        tooltipText += `Base: ${baseFervor}\nLevel (${level} × ${rarityGain}): ${levelFervor}\nStella (${stellaTier || 'none'}): ${stellaFervor}`;
        if (sixStarBonus > 0) tooltipText += `\n6★ Bonus (${level} × 50): ${sixStarBonus}`;
        tooltipText += `\nSubtotal: ${subtotal}\nGlory (${subtotal} × ${gloryMulti}): ${priestFervor}\n\nDevotees: ${devoteFervor}\nTotal: ${totalFervor}`;

        fervorDisplay.innerHTML = `<span class="fervor-glory">${totalFervor}</span>`;
        fervorDisplay.title = tooltipText;
        fervorDisplay.style.display = 'flex';
        fervorDisplay.dataset.lithCost = lithCost;
        fervorDisplay.dataset.fervorUpgrade = fervorUpgrade;
        updateEfficiencyIndicators();
    }
}

/**
 * Calculate total fervor for all devotees in a biome
 * @param {HTMLElement} biomeSection - The biome section element
 * @returns {number} - Total devotee fervor for the biome
 */
function calculateBiomeDevoteeFervor(biomeSection) {
    const devoteeRows = biomeSection.querySelectorAll('.devotees-selector .mon-row');
    let totalDevoteFervor = 0;

    devoteeRows.forEach(row => {
        const select = row.querySelector('.mon-select');
        const starInput = row.querySelector('.star-input');
        const levelInput = row.querySelector('.level-input');
        const stellaSelect = row.querySelector('.stella-input');

        const monName = select?.value;
        if (!monName) return; // Skip empty slots

        const starLevel = parseInt(starInput?.value);
        const level = parseInt(levelInput?.value) || 0;
        const stellaValue = stellaSelect?.value?.trim() || '';
        const stellaTier = stellaValue ? `${starLevel}.${stellaValue}` : '';
        const selectedOption = select.options[select.selectedIndex];
        const rarity = selectedOption?.dataset?.rarity || '';
        const gloryMulti = parseFloat(selectedOption?.dataset?.gloryMulti) || 1;

        if (starLevel) {
            const baseFervor = BASE_FERVOR['Devotee']?.[starLevel] || 0;
            const rarityGain = RARITY_LEVEL_GAIN['Devotee']?.[rarity] || 0;
            const levelFervor = level * rarityGain;
            const stellaFervor = getStellaFervorUpToTier(starLevel, stellaTier, 'Devotee');
            const sixStarBonus = (starLevel >= 6) && (rarity === 'SS' || rarity === 'SSS') ? (level * 10) : 0;
            const subtotal = baseFervor + levelFervor + stellaFervor + sixStarBonus;
            const devoteFervor = Math.floor(subtotal * gloryMulti);
            totalDevoteFervor += devoteFervor;
        }
    });

    return totalDevoteFervor;
}

// =============== EFFICIENCY INDICATOR ===============

/**
 * Update the green/red efficiency indicators for all priests and devotees.
 * Efficiency = FervorUpgrade / LithCost (higher = more fervor per lith = better).
 * Within each group the mon(s) tied for highest ratio get a green arrow; all others get a red X.
 */
function updateEfficiencyIndicators() {
    const allRows = document.querySelectorAll('.mon-row');
    const devoteeEntries = [];
    const priestEntries = [];

    allRows.forEach(row => {
        const fervorDisplay = row.querySelector('.fervor-display');
        const indicator = row.querySelector('.efficiency-indicator');
        if (!fervorDisplay || !indicator) return;

        // Skip rows in disabled biomes
        const biomeSection = row.closest('.biome-section');
        if (biomeSection && biomeSection.classList.contains('biome-disabled')) return;

        const lithCost = parseFloat(fervorDisplay.dataset.lithCost);
        const fervorUpgrade = parseFloat(fervorDisplay.dataset.fervorUpgrade);
        const levelInput = row.querySelector('.level-input');
        const level = parseInt(levelInput?.value) || 0;
        const maxLevel = parseInt(levelInput?.max) || 250;

        if (!fervorDisplay.dataset.lithCost || lithCost <= 0 || fervorUpgrade <= 0) {
            indicator.style.display = 'none';
            return;
        }

        if (level >= maxLevel) {
            indicator.textContent = '▬';
            indicator.className = 'efficiency-indicator efficiency-max';
            indicator.title = 'Max level reached';
            indicator.style.display = 'flex';
            return;
        }

        const efficiency = fervorUpgrade / lithCost;
        const isPriest = row.closest('.priest-selector') !== null;
        const entry = { row, indicator, efficiency };

        if (isPriest) priestEntries.push(entry);
        else devoteeEntries.push(entry);
    });

    applyEfficiencyIndicators(devoteeEntries);
    applyEfficiencyIndicators(priestEntries);
}

function applyEfficiencyIndicators(entries) {
    if (entries.length === 0) return;

    const maxEff = Math.max(...entries.map(e => e.efficiency));

    entries.forEach(({ indicator, efficiency }) => {
        const isBest = Math.abs(efficiency - maxEff) < 0.00001;
        indicator.textContent = isBest ? '▲' : '✕';
        indicator.className = `efficiency-indicator ${isBest ? 'efficiency-best' : 'efficiency-worst'}`;
        indicator.title = `Efficiency: ${efficiency.toFixed(4)} fervor/lith`;
        indicator.style.display = 'flex';
    });
}

// =============== LEVEL CAP CALCULATION ===============

/**
 * Get max level for a protomon based on star level and role
 * Devotees: (starLevel - 1) * 20  →  3★=40, 4★=60, 5★=80, 6★=100
 * Priests:  (starLevel - 1) * 40  →  3★=80, 4★=120, 5★=160, 6★=200
 * @param {number} starLevel
 * @param {string} role - "Devotee" or "Priest"
 * @returns {number}
 */
function getMaxLevel(starLevel, role) {
    if (!starLevel || starLevel < 3) return 250;
    return (starLevel - 1) * (role === 'Priest' ? 40 : 20);
}

function getMaxStarForRarity(rarity) {
    switch (rarity) {
        case 'SSS':
        case 'SS': return 7;
        case 'S': return 6;
        case 'Purple': return 5;
        case 'Blue': return 4;
        default: return 7;
    }
}

function updateStarOptions(starInput, rarity) {
    const max = getMaxStarForRarity(rarity);
    Array.from(starInput.options).forEach(opt => {
        if (!opt.value) return;
        opt.hidden = parseInt(opt.value) > max;
        opt.disabled = parseInt(opt.value) > max;
    });
    if (parseInt(starInput.value) > max) {
        starInput.value = max;
    }
}

// =============== LITH COST CALCULATION ===============

/**
 * Calculate the lith cost to level up a protomon at its current level
 * Both Devotee and Priest share the same formula
 * @param {number} level - Current level of the protomon
 * @returns {number} - Lith cost for the next level-up at this level
 */
function calculateLithCost(level) {
    if (!level || level <= 0) return 0;
    if (level <= 59) {
        return 120 + (level - 1) * 60;
    } else if (level <= 119) {
        return 120 + (58 * 60) + ((level - 59) * 80);
    } else {
        return 120 + (58 * 60) + (60 * 80) + ((level - 119) * 100);
    }
}

function calculateFervorUpgrade(subtotal, rarityGain, gloryMulti, currentFervor, starLevel, role, rarity = '') {
    const isSixStarUpgraded = starLevel >= 6 && (rarity === 'SS' || rarity === 'SSS');
    const sixStarRatePerLevel = isSixStarUpgraded ? (role === 'Priest' ? 50 : 10) : 0;
    return Math.floor(((subtotal + rarityGain + sixStarRatePerLevel) * gloryMulti) - currentFervor);
}

// =============== STELLA FERVOR CALCULATION FUNCTIONS ===============

/**
 * Get maximum tier for a stella based on star level
 * @param {number} starLevel - Star level (3-8)
 * @returns {number} - Maximum tier (6 or 12)
 */
function getMaxTierForStella(starLevel) {
    // For 3-star protomon, all stellas only go to tier 6
    // For 4-star and above, all stellas go to tier 12
    if (starLevel === 3) {
        return 6;
    }
    return 12;
}

/**
 * Calculate fervor for a specific stella tier
 * @param {string} stellaTier - Format: "X.Y.Z" (e.g., "3.1.6", "4.2.12")
 * @param {string} role - "Devotee" or "Priest"
 * @returns {number} - Fervor value for this tier
 */
function calculateFervor(stellaTier, role = 'Devotee') {
    const parts = stellaTier.split('.');
    if (parts.length !== 3) {
        console.error('Invalid stella tier format:', stellaTier);
        return 0;
    }

    const star = parseInt(parts[0]);
    const stella = parseInt(parts[1]);
    const tier = parseInt(parts[2]);

    if (isNaN(star) || isNaN(stella) || isNaN(tier)) {
        console.error('Invalid stella tier values:', stellaTier);
        return 0;
    }

    // Tier 0 always gives 0 fervor
    if (tier === 0) return 0;

    // STAR 3 DEVOTEE - use dedicated lookup table
    if (star === 3 && role === 'Devotee') {
        return STAR_3_DEVOTEE_FERVOR[stellaTier] || 0;
    }

    // PRIEST CALCULATION (different system than devotees)
    if (role === 'Priest') {
        // Star 3: Only tier 3 gives fervor (75)
        // Star 4+: Tiers 3 and 9 give fervor (100, 125, 150, etc.)
        // Formula: 25 * star level
        if (tier === 3) {
            return 25 * star;
        }
        if (tier === 9 && star >= 4) {
            return 25 * star;
        }
        return 0;
    }

    // DEVOTEE CALCULATION (milestone-based system)
    const baseFervor = star; // Base fervor equals star level

    // Check for milestone bonuses at .6 and .12 positions
    if (tier === 6 || tier === 12) {
        const key = stellaTier;
        if (DEVOTEE_MILESTONE_BONUSES[key] !== undefined) {
            return DEVOTEE_MILESTONE_BONUSES[key];
        }
        // If not a milestone, return 0 (these are boundary tiers)
        return 0;
    }

    // Normal tiers (1-5, 7-11) use base fervor
    return baseFervor;
}

/**
 * Calculate stella fervor for all stellas at a given star level
 * @param {number} starLevel - The star level (3, 4, 5, 6, etc.)
 * @param {string} role - "Devotee" or "Priest"
 * @returns {number} - Total cumulative stella fervor for that star level
 */
function getStellaFervorForStarLevel(starLevel, role = 'Devotee') {
    if (!starLevel || starLevel < 3) return 0;

    // Define stella counts per star level based on game data
    const stellaCounts = {
        3: 5,   // 3→4 star has 5 stellas
        4: 12,  // 4→5 star has 12 stellas
        5: 12,  // 5→6 star has 12 stellas
        6: 18,  // 6→7 star has 18 stellas (incomplete data)
        7: 18,  // Assumed for future
        8: 18   // Assumed for future
    };

    const maxStella = stellaCounts[starLevel] || 12;
    let totalFervor = 0;

    // Calculate fervor for all stellas
    for (let stella = 1; stella <= maxStella; stella++) {
        const maxTier = getMaxTierForStella(starLevel, stella);

        for (let tier = 0; tier <= maxTier; tier++) {
            const tierKey = `${starLevel}.${stella}.${tier}`;
            totalFervor += calculateFervor(tierKey, role);
        }
    }

    return totalFervor;
}

/**
 * Calculate stella fervor up to a specific tier
 * @param {number} starLevel - The star level (3, 4, 5, 6, etc.)
 * @param {string} stellaTier - The stella tier (e.g., "3.1.6", "4.2.12")
 * @param {string} role - "Devotee" or "Priest"
 * @returns {number} - Cumulative stella fervor up to that tier
 */
function getStellaFervorUpToTier(starLevel, stellaTier, role = 'Devotee') {
    const parts = stellaTier.split('.');
    if (parts.length !== 3) {
        return getStellaFervorForStarLevel(starLevel, role);
    }

    const [tierStar, targetStella, targetTier] = parts.map(Number);

    // Validate that the stella tier matches the star level
    if (tierStar !== starLevel) {
        return getStellaFervorForStarLevel(starLevel, role);
    }

    let totalFervor = 0;

    // Calculate fervor from stella 1 up to the target stella
    for (let stella = 1; stella <= targetStella; stella++) {
        const maxTier = getMaxTierForStella(starLevel, stella);
        const endTier = stella === targetStella ? targetTier : maxTier;

        for (let tier = 0; tier <= endTier; tier++) {
            const tierKey = `${starLevel}.${stella}.${tier}`;
            totalFervor += calculateFervor(tierKey, role);
        }
    }

    return totalFervor;
}

