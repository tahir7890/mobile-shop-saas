// Utility Functions for Safe DOM Access

/**
 * Safely get element value - returns empty string if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @returns {string} The element value or empty string
 */
function safeGetValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

/**
 * Safely set element value - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @param {string} value - The value to set
 */
function safeSetValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
    }
}

/**
 * Safely get element - returns null if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @returns {HTMLElement|null} The element or null
 */
function safeGetElement(elementId) {
    return document.getElementById(elementId);
}

/**
 * Check if element exists
 * @param {string} elementId - The ID of the element
 * @returns {boolean} True if element exists
 */
function elementExists(elementId) {
    return document.getElementById(elementId) !== null;
}

/**
 * Safely get number value - returns 0 if element doesn't exist or value is invalid
 * @param {string} elementId - The ID of the element
 * @returns {number} The number value or 0
 */
function safeGetNumber(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return 0;
    const value = parseFloat(element.value);
    return isNaN(value) ? 0 : value;
}

/**
 * Safely get integer value - returns 0 if element doesn't exist or value is invalid
 * @param {string} elementId - The ID of the element
 * @returns {number} The integer value or 0
 */
function safeGetInt(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return 0;
    const value = parseInt(element.value);
    return isNaN(value) ? 0 : value;
}

/**
 * Safely get checkbox checked state - returns false if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @returns {boolean} The checked state or false
 */
function safeGetChecked(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.checked : false;
}

/**
 * Safely set checkbox checked state - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @param {boolean} checked - The checked state to set
 */
function safeSetChecked(elementId, checked) {
    const element = document.getElementById(elementId);
    if (element) {
        element.checked = checked;
    }
}

/**
 * Safely set element text content - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @param {string} text - The text content to set
 */
function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Safely set element HTML - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @param {string} html - The HTML content to set
 */
function safeSetHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * Safely add class to element - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @param {string} className - The class name to add
 */
function safeAddClass(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add(className);
    }
}

/**
 * Safely remove class from element - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @param {string} className - The class name to remove
 */
function safeRemoveClass(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove(className);
    }
}

/**
 * Safely toggle class on element - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 * @param {string} className - The class name to toggle
 * @param {boolean} force - Optional force state
 */
function safeToggleClass(elementId, className, force) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle(className, force);
    }
}

/**
 * Safely show element - removes 'd-none' class
 * @param {string} elementId - The ID of the element
 */
function safeShow(elementId) {
    safeRemoveClass(elementId, 'd-none');
}

/**
 * Safely hide element - adds 'd-none' class
 * @param {string} elementId - The ID of the element
 */
function safeHide(elementId) {
    safeAddClass(elementId, 'd-none');
}

/**
 * Safely focus element - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 */
function safeFocus(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.focus();
    }
}

/**
 * Safely disable element - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 */
function safeDisable(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.disabled = true;
    }
}

/**
 * Safely enable element - does nothing if element doesn't exist
 * @param {string} elementId - The ID of the element
 */
function safeEnable(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.disabled = false;
    }
}
