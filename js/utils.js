/**
 * AI Aggregator Website - Utility Functions
 * Helper functions for API requests, file operations, and common utilities
 */

// API Request Function
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': AppState.sessionId
        },
        timeout: API_CONFIG.timeout
    };

    const config = { ...defaultOptions, ...options };

    // Add body if provided
    if (config.body && typeof config.body === 'string') {
        config.body = config.body;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
            ...config,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// File Download Function
function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

// Copy to Clipboard Function
async function copyToClipboard(text, button = null) {
    try {
        await navigator.clipboard.writeText(text);

        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');

            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }

        showToast('Copied to clipboard', 'success', 2000);

    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy to clipboard', 'error');
    }
}

// Export Functions
function generateMarkdownExport(results) {
    let markdown = `# AI Aggregator Results\n\n`;
    markdown += `**Query:** ${results.query}\n`;
    markdown += `**Type:** ${formatQueryType(results.query_type)}\n`;
    markdown += `**Services Used:** ${results.services_used.join(', ')}\n`;
    markdown += `**Generated:** ${formatDate(results.timing.created_at)}\n\n`;

    // Aggregated Solution
    if (results.aggregated_solution) {
        markdown += `## Aggregated Solution\n\n`;
        markdown += `### Summary\n${results.aggregated_solution.summary}\n\n`;
        markdown += `### Recommended Approach\n${results.aggregated_solution.best_approach}\n\n`;

        if (results.aggregated_solution.confidence) {
            markdown += `**Confidence:** ${Math.round(results.aggregated_solution.confidence * 100)}%\n\n`;
        }
    }

    // Individual Responses
    if (results.individual_responses && results.individual_responses.length > 0) {
        markdown += `## Individual AI Responses\n\n`;

        results.individual_responses.forEach(response => {
            markdown += `### ${formatServiceName(response.service_name)}\n`;
            markdown += `**Confidence:** ${Math.round((response.confidence || 0) * 100)}%\n`;
            markdown += `**Response Time:** ${((response.response_time_ms || 0) / 1000).toFixed(1)}s\n`;
            markdown += `**Cost:** $${(response.cost_usd || 0).toFixed(4)}\n\n`;
            markdown += `${response.processed_response?.response || response.raw_response}\n\n---\n\n`;
        });
    }

    // Generated Code
    if (results.generated_code && results.generated_code.files && results.generated_code.files.length > 0) {
        markdown += `## Generated Code\n\n`;

        results.generated_code.files.forEach(file => {
            markdown += `### ${file.filename}\n`;
            markdown += `**Language:** ${file.language}\n\n`;
            markdown += `\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
        });
    }

    // Implementation Guide
    if (results.implementation_guide) {
        markdown += `## Implementation Guide\n\n`;

        if (results.implementation_guide.overview) {
            markdown += `### Overview\n${results.implementation_guide.overview}\n\n`;
        }

        if (results.implementation_guide.prerequisites && results.implementation_guide.prerequisites.length > 0) {
            markdown += `### Prerequisites\n\n`;
            results.implementation_guide.prerequisites.forEach(prereq => {
                markdown += `- **${prereq.name}:** ${prereq.description}\n`;
            });
            markdown += `\n`;
        }

        if (results.implementation_guide.steps && results.implementation_guide.steps.length > 0) {
            markdown += `### Implementation Steps\n\n`;
            results.implementation_guide.steps.forEach(step => {
                markdown += `${step.step}. **${step.title}**\n${step.description}\n`;
                if (step.commands && step.commands.length > 0) {
                    markdown += `\`\`\`bash\n${step.commands.join('\n')}\n\`\`\`\n`;
                }
                markdown += `\n`;
            });
        }

        if (results.implementation_guide.run_commands && results.implementation_guide.run_commands.length > 0) {
            markdown += `### Run Commands\n\n`;
            markdown += `\`\`\`bash\n${results.implementation_guide.run_commands.join('\n')}\n\`\`\`\n\n`;
        }

        if (results.implementation_guide.expected_output) {
            markdown += `### Expected Output\n${results.implementation_guide.expected_output}\n\n`;
        }
    }

    return markdown;
}

function generateHTMLExport(results) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Aggregator Results - ${results.query}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .query-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #667eea;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .response-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .response-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        .service-name {
            font-weight: bold;
            color: #667eea;
        }
        .code-block {
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 15px 0;
        }
        .code-header {
            background: #e9ecef;
            padding: 8px 15px;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
            color: #666;
        }
        .code-content {
            padding: 15px;
            overflow-x: auto;
        }
        .code-content pre {
            margin: 0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
        }
        .implementation-step {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 15px;
        }
        .step-number {
            display: inline-block;
            width: 30px;
            height: 30px;
            background: #667eea;
            color: white;
            text-align: center;
            line-height: 30px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .command-block {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            margin: 10px 0;
        }
        .metric {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            margin-right: 10px;
        }
        @media print {
            body { padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Aggregator Results</h1>
        <div class="query-info">
            <strong>Query:</strong> ${escapeHtml(results.query)}<br>
            <strong>Type:</strong> ${formatQueryType(results.query_type)}<br>
            <strong>Services:</strong> ${results.services_used.join(', ')}<br>
            <strong>Generated:</strong> ${formatDate(results.timing.created_at)}<br>
            <strong>Total Cost:</strong> $${(results.cost?.actual || 0).toFixed(4)}
        </div>
    </div>`;

    // Aggregated Solution
    if (results.aggregated_solution) {
        html += `
    <div class="section">
        <h2>Aggregated Solution</h2>
        <div class="summary">
            <h3>Summary</h3>
            <p>${escapeHtml(results.aggregated_solution.summary)}</p>
            ${results.aggregated_solution.confidence ? `<span class="metric">Confidence: ${Math.round(results.aggregated_solution.confidence * 100)}%</span>` : ''}
        </div>
        <div class="approach">
            <h3>Recommended Approach</h3>
            <div>${formatMarkdown(results.aggregated_solution.best_approach)}</div>
        </div>
    </div>`;
    }

    // Individual Responses
    if (results.individual_responses && results.individual_responses.length > 0) {
        html += `
    <div class="section">
        <h2>Individual AI Responses</h2>`;

        results.individual_responses.forEach(response => {
            html += `
        <div class="response-card">
            <div class="response-header">
                <span class="service-name">${formatServiceName(response.service_name)}</span>
                <div>
                    <span class="metric">${Math.round((response.confidence || 0) * 100)}% confidence</span>
                    <span class="metric">${((response.response_time_ms || 0) / 1000).toFixed(1)}s</span>
                    <span class="metric">$${(response.cost_usd || 0).toFixed(4)}</span>
                </div>
            </div>
            <div class="response-content">
                ${formatMarkdown(response.processed_response?.response || response.raw_response)}
            </div>
        </div>`;
        });

        html += `
    </div>`;
    }

    // Generated Code
    if (results.generated_code && results.generated_code.files && results.generated_code.files.length > 0) {
        html += `
    <div class="section">
        <h2>Generated Code</h2>`;

        results.generated_code.files.forEach(file => {
            html += `
        <div class="code-block">
            <div class="code-header">${file.filename} (${file.language})</div>
            <div class="code-content">
                <pre>${escapeHtml(file.content)}</pre>
            </div>
        </div>`;
        });

        html += `
    </div>`;
    }

    // Implementation Guide
    if (results.implementation_guide) {
        html += `
    <div class="section">
        <h2>Implementation Guide</h2>`;

        if (results.implementation_guide.overview) {
            html += `
        <div class="overview">
            <h3>Overview</h3>
            <p>${escapeHtml(results.implementation_guide.overview)}</p>
        </div>`;
        }

        if (results.implementation_guide.steps && results.implementation_guide.steps.length > 0) {
            html += `
        <div class="steps">
            <h3>Implementation Steps</h3>`;

            results.implementation_guide.steps.forEach(step => {
                html += `
            <div class="implementation-step">
                <span class="step-number">${step.step}</span>
                <strong>${escapeHtml(step.title)}</strong><br>
                ${escapeHtml(step.description)}`;

                if (step.commands && step.commands.length > 0) {
                    html += `
                <div class="command-block">${escapeHtml(step.commands.join('\n'))}</div>`;
                }

                html += `
            </div>`;
            });

            html += `
        </div>`;
        }

        if (results.implementation_guide.run_commands && results.implementation_guide.run_commands.length > 0) {
            html += `
        <div class="run-commands">
            <h3>Run Commands</h3>
            <div class="command-block">${escapeHtml(results.implementation_guide.run_commands.join('\n'))}</div>
        </div>`;
        }

        html += `
    </div>`;
    }

    html += `
    <div class="footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>Generated by AI Aggregator on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;

    return html;
}

// Error Handling
class APIError extends Error {
    constructor(message, status = null, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Validation Functions
function validateQuery(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('Query must be a non-empty string');
    }

    if (query.trim().length === 0) {
        throw new Error('Query cannot be empty');
    }

    if (query.length > 5000) {
        throw new Error('Query is too long (maximum 5000 characters)');
    }

    return query.trim();
}

function validateServices(services) {
    if (!Array.isArray(services)) {
        throw new Error('Services must be an array');
    }

    if (services.length === 0) {
        throw new Error('At least one service must be selected');
    }

    const validServices = ['chatgpt', 'deepseek', 'perplexity', 'copilot'];
    const invalidServices = services.filter(service => !validServices.includes(service));

    if (invalidServices.length > 0) {
        throw new Error(`Invalid services: ${invalidServices.join(', ')}`);
    }

    return services;
}

// Local Storage Utilities
const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Failed to get ${key} from storage:`, error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Failed to set ${key} in storage:`, error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key} from storage:`, error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }
};

// Performance Utilities
const Performance = {
    mark(name) {
        if (performance && performance.mark) {
            performance.mark(name);
        }
    },

    measure(name, startMark, endMark) {
        if (performance && performance.measure) {
            performance.measure(name, startMark, endMark);
            const entries = performance.getEntriesByName(name);
            return entries.length > 0 ? entries[entries.length - 1].duration : null;
        }
        return null;
    },

    async measureAsync(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;

        this.mark(startMark);
        const result = await fn();
        this.mark(endMark);

        const duration = this.measure(name, startMark, endMark);
        console.log(`${name} took ${duration?.toFixed(2)}ms`);

        return result;
    }
};

// Debounce and Throttle
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// URL Utilities
function updateURLParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

function getURLParam(key, defaultValue = null) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key) || defaultValue;
}

// Device Detection
const Device = {
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    isTablet() {
        return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent);
    },

    isDesktop() {
        return !this.isMobile() && !this.isTablet();
    },

    getOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) return 'macOS';
        if (userAgent.includes('win')) return 'Windows';
        if (userAgent.includes('linux')) return 'Linux';
        if (userAgent.includes('android')) return 'Android';
        if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
        return 'Unknown';
    }
};

// Array Utilities
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function unique(array) {
    return [...new Set(array)];
}

function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = typeof key === 'function' ? key(item) : item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
}

// String Utilities
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function truncate(text, length, suffix = '...') {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Color Utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
}

// Date Utilities
function formatDate(dateString, format = 'relative') {
    const date = new Date(dateString);
    const now = new Date();

    switch (format) {
        case 'relative':
            return getRelativeTimeString(date, now);
        case 'short':
            return date.toLocaleDateString();
        case 'long':
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        default:
            return date.toISOString();
    }
}

function getRelativeTimeString(date, now) {
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 10) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

// Export utilities for use in other modules
window.Utils = {
    apiRequest,
    downloadFile,
    copyToClipboard,
    generateMarkdownExport,
    generateHTMLExport,
    APIError,
    validateQuery,
    validateServices,
    Storage,
    Performance,
    debounce,
    throttle,
    updateURLParams,
    getURLParam,
    Device,
    chunk,
    unique,
    groupBy,
    slugify,
    truncate,
    capitalize,
    hexToRgb,
    rgbToHex,
    getContrastColor,
    formatDate,
    getRelativeTimeString
};