/**
 * AI Aggregator Website - Main Application JavaScript
 * Handles UI interactions, API communication, and application state
 */

// Application State
const AppState = {
    currentQuery: null,
    currentResults: null,
    sessionId: null,
    history: [],
    theme: localStorage.getItem('theme') || 'light',
    processingQuery: false
};

// API Configuration
const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' ?
        'http://localhost:5000/api' : '/api',
    timeout: 30000 // 30 seconds
};

// DOM Elements
const Elements = {
    // Input Elements
    queryInput: document.getElementById('queryInput'),
    charCount: document.getElementById('charCount'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    clearBtn: document.getElementById('clearBtn'),

    // Modal Elements
    serviceModal: document.getElementById('serviceModal'),
    closeModal: document.getElementById('closeModal'),
    queryAnalysis: document.getElementById('queryAnalysis'),
    serviceSelection: document.getElementById('serviceSelection'),
    recommendedServices: document.getElementById('recommendedServices'),
    alternativeServices: document.getElementById('alternativeServices'),
    submitQueryBtn: document.getElementById('submitQueryBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),

    // Progress Elements
    progressSection: document.getElementById('progressSection'),
    overallProgress: document.getElementById('overallProgress'),
    progressText: document.getElementById('progressText'),
    serviceProgress: document.getElementById('serviceProgress'),

    // Results Elements
    resultsSection: document.getElementById('resultsSection'),
    aggregatedContent: document.getElementById('aggregatedContent'),
    individualResponses: document.getElementById('individualResponses'),
    generatedCode: document.getElementById('generatedCode'),
    implementationGuide: document.getElementById('implementationGuide'),
    exportBtn: document.getElementById('exportBtn'),
    newQueryBtn: document.getElementById('newQueryBtn'),

    // Tab Elements
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // History Elements
    historyBtn: document.getElementById('historyBtn'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    historySearch: document.getElementById('historySearch'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    // Theme Elements
    themeToggle: document.getElementById('themeToggle'),

    // Utility Elements
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize session
    initializeSession();

    // Set up event listeners
    setupEventListeners();

    // Apply saved theme
    applyTheme(AppState.theme);

    // Load history
    loadHistory();

    // Check API health
    checkAPIHealth();

    console.log('AI Aggregator initialized');
}

function initializeSession() {
    // Get or create session ID
    AppState.sessionId = localStorage.getItem('sessionId') || generateUUID();
    localStorage.setItem('sessionId', AppState.sessionId);
}

function setupEventListeners() {
    // Query input events
    Elements.queryInput.addEventListener('input', handleQueryInput);
    Elements.queryInput.addEventListener('paste', () => {
        setTimeout(handleQueryInput, 10);
    });

    Elements.clearBtn.addEventListener('click', clearQuery);
    Elements.analyzeBtn.addEventListener('click', analyzeQuery);

    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });

    // Modal events
    Elements.closeModal.addEventListener('click', closeModal);
    Elements.cancelModalBtn.addEventListener('click', closeModal);
    Elements.submitQueryBtn.addEventListener('click', submitQuery);
    Elements.serviceModal.addEventListener('click', handleModalBackdrop);

    // Tab events
    Elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });

    // Results events
    Elements.newQueryBtn.addEventListener('click', startNewQuery);
    Elements.exportBtn.addEventListener('click', exportResults);

    // History events
    Elements.historyBtn.addEventListener('click', toggleHistory);
    Elements.clearHistoryBtn.addEventListener('click', clearHistory);
    Elements.historySearch.addEventListener('input', debounce(searchHistory, 300));

    // Theme toggle
    Elements.themeToggle.addEventListener('click', toggleTheme);

    // Advanced options
    const temperatureSlider = document.getElementById('temperature');
    const tempValue = document.getElementById('tempValue');
    if (temperatureSlider && tempValue) {
        temperatureSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleQueryInput() {
    const query = Elements.queryInput.value.trim();
    const charCount = query.length;

    // Update character count
    Elements.charCount.textContent = `${charCount} / 5000`;

    // Enable/disable analyze button
    Elements.analyzeBtn.disabled = charCount === 0 || charCount > 5000;

    // Update character count color
    if (charCount > 4500) {
        Elements.charCount.style.color = 'var(--error-color)';
    } else if (charCount > 4000) {
        Elements.charCount.style.color = 'var(--warning-color)';
    } else {
        Elements.charCount.style.color = 'var(--text-muted)';
    }
}

function handleQuickAction(e) {
    const template = e.target.dataset.template;
    const templates = {
        'web-dev': 'Create a responsive web application with HTML, CSS, and JavaScript that includes a homepage, about page, and contact form. The application should be mobile-friendly and include smooth animations.',
        'debugging': 'I have an error in my code and need help debugging it. The error message is: [Your error message here]. Please help me identify the issue and provide a solution.',
        'analysis': 'I need help analyzing data and creating visualizations. I have a dataset that contains [describe your data]. Please help me understand the patterns and create meaningful charts.',
        'research': 'What are the latest trends and developments in [your topic]? Please provide current information and insights about what\'s happening in this field.'
    };

    if (templates[template]) {
        Elements.queryInput.value = templates[template];
        handleQueryInput();
        Elements.queryInput.focus();
    }
}

function clearQuery() {
    Elements.queryInput.value = '';
    handleQueryInput();
    Elements.queryInput.focus();
}

async function analyzeQuery() {
    const query = Elements.queryInput.value.trim();
    if (!query) return;

    try {
        showLoading(Elements.analyzeBtn);

        const response = await apiRequest('/analyze', {
            method: 'POST',
            body: JSON.stringify({
                query: query,
                context: {
                    previous_queries: AppState.history.slice(-3).map(h => h.query),
                    user_preferences: {
                        theme: AppState.theme
                    }
                }
            })
        });

        if (response.success) {
            showServiceSelection(response.data);
        } else {
            showToast('Failed to analyze query: ' + response.error, 'error');
        }

    } catch (error) {
        console.error('Analysis error:', error);
        showToast('Failed to analyze query. Please try again.', 'error');
    } finally {
        hideLoading(Elements.analyzeBtn);
    }
}

function showServiceSelection(analysisData) {
    Elements.queryAnalysis.innerHTML = `
        <div class="analysis-result">
            <h4>Query Analysis</h4>
            <p><strong>Type:</strong> ${formatQueryType(analysisData.query_type)}</p>
            <p><strong>Services Available:</strong> ${analysisData.total_available}</p>
        </div>
    `;

    // Show recommended services
    Elements.recommendedServices.innerHTML = '';
    analysisData.recommended_services.forEach(service => {
        const serviceElement = createServiceElement(service, true);
        Elements.recommendedServices.appendChild(serviceElement);
    });

    // Show alternative services
    Elements.alternativeServices.innerHTML = '';
    if (analysisData.alternatives.length > 0) {
        Elements.alternativeServices.parentElement.style.display = 'block';
        analysisData.alternatives.forEach(serviceName => {
            const serviceElement = createServiceElement({
                service: serviceName,
                reason: 'Additional service option',
                confidence: 0.7,
                estimated_time: '3-6 seconds'
            }, false);
            Elements.alternativeServices.appendChild(serviceElement);
        });
    } else {
        Elements.alternativeServices.parentElement.style.display = 'none';
    }

    // Show modal
    Elements.serviceSelection.style.display = 'block';
    Elements.serviceModal.classList.add('active');
}

function createServiceElement(service, isRecommended) {
    const div = document.createElement('div');
    div.className = `service-item ${isRecommended ? 'recommended' : 'alternative'}`;
    div.dataset.service = service.service;

    div.innerHTML = `
        <div class="service-header">
            <span class="service-name">${formatServiceName(service.service)}</span>
            <span class="service-confidence">${Math.round(service.confidence * 100)}% confidence</span>
        </div>
        <div class="service-description">${service.reason}</div>
        <div class="service-details">
            <span>⏱️ ${service.estimated_time}</span>
        </div>
    `;

    div.addEventListener('click', () => toggleServiceSelection(div));

    return div;
}

function toggleServiceSelection(element) {
    element.classList.toggle('selected');
}

function closeModal() {
    Elements.serviceModal.classList.remove('active');
    setTimeout(() => {
        Elements.serviceSelection.style.display = 'none';
        Elements.queryAnalysis.innerHTML = '<div class="analysis-loading"><div class="spinner"></div><p>Analyzing your query...</p></div>';
    }, 300);
}

function handleModalBackdrop(e) {
    if (e.target === Elements.serviceModal) {
        closeModal();
    }
}

async function submitQuery() {
    const selectedServices = Array.from(document.querySelectorAll('.service-item.selected'))
        .map(el => el.dataset.service);

    if (selectedServices.length === 0) {
        showToast('Please select at least one AI service', 'warning');
        return;
    }

    const query = Elements.queryInput.value.trim();
    const options = {
        temperature: parseFloat(document.getElementById('temperature')?.value || 0.7),
        max_tokens: parseInt(document.getElementById('maxTokens')?.value || 2000),
        include_code: document.getElementById('includeCode')?.checked !== false
    };

    try {
        closeModal();
        showLoading(Elements.submitQueryBtn);

        const response = await apiRequest('/query', {
            method: 'POST',
            body: JSON.stringify({
                query: query,
                services: selectedServices,
                options: options,
                query_type: AppState.currentAnalysis?.query_type || 'general'
            })
        });

        if (response.success) {
            AppState.currentQuery = response.data;
            await monitorQueryProgress(response.data.query_id);
        } else {
            showToast('Failed to submit query: ' + response.error, 'error');
        }

    } catch (error) {
        console.error('Submit error:', error);
        showToast('Failed to submit query. Please try again.', 'error');
    } finally {
        hideLoading(Elements.submitQueryBtn);
    }
}

async function monitorQueryProgress(queryId) {
    showProgress();
    AppState.processingQuery = true;

    const pollInterval = setInterval(async () => {
        try {
            const response = await apiRequest(`/query/${queryId}/status`);

            if (response.success) {
                updateProgress(response.data);

                if (response.data.status === 'completed') {
                    clearInterval(pollInterval);
                    await loadResults(queryId);
                    AppState.processingQuery = false;
                } else if (response.data.status === 'failed') {
                    clearInterval(pollInterval);
                    showToast('Query processing failed: ' + (response.data.error_message || 'Unknown error'), 'error');
                    hideProgress();
                    AppState.processingQuery = false;
                }
            } else {
                console.error('Status check failed:', response.error);
            }

        } catch (error) {
            console.error('Status check error:', error);
            clearInterval(pollInterval);
            showToast('Failed to check query status', 'error');
            hideProgress();
            AppState.processingQuery = false;
        }
    }, 2000); // Poll every 2 seconds
}

function showProgress() {
    Elements.progressSection.style.display = 'block';
    Elements.progressSection.scrollIntoView({ behavior: 'smooth' });
}

function hideProgress() {
    Elements.progressSection.style.display = 'none';
}

function updateProgress(progressData) {
    // Update overall progress
    const overallPercent = progressData.progress?.overall || 0;
    Elements.overallProgress.style.width = `${overallPercent}%`;
    Elements.progressText.textContent = progressData.estimated_completion || 'Processing...';

    // Update service progress
    Elements.serviceProgress.innerHTML = '';
    if (progressData.progress?.services) {
        Object.entries(progressData.progress.services).forEach(([service, percent]) => {
            const serviceProgress = document.createElement('div');
            serviceProgress.className = 'service-progress-item';
            serviceProgress.innerHTML = `
                <span class="service-progress-name">${formatServiceName(service)}</span>
                <div class="service-progress-bar">
                    <div class="service-progress-fill" style="width: ${percent}%"></div>
                </div>
                <span class="service-progress-status">${getProgressStatus(percent)}</span>
            `;
            Elements.serviceProgress.appendChild(serviceProgress);
        });
    }
}

function getProgressStatus(percent) {
    if (percent === 0) return 'Pending';
    if (percent < 100) return 'Processing';
    return 'Completed';
}

async function loadResults(queryId) {
    try {
        showLoading();

        const response = await apiRequest(`/query/${queryId}/results`);

        if (response.success) {
            AppState.currentResults = response.data;
            displayResults(response.data);
            addToHistory(response.data);
            hideProgress();
            showResults();
        } else {
            showToast('Failed to load results: ' + response.error, 'error');
        }

    } catch (error) {
        console.error('Load results error:', error);
        showToast('Failed to load results. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function displayResults(results) {
    // Display aggregated solution
    displayAggregatedSolution(results.aggregated_solution);

    // Display individual responses
    displayIndividualResponses(results.individual_responses);

    // Display generated code
    displayGeneratedCode(results.generated_code.files);

    // Display implementation guide
    displayImplementationGuide(results.implementation_guide);

    // Switch to first tab
    switchTab('aggregated');
}

function displayAggregatedSolution(aggregated) {
    Elements.aggregatedContent.innerHTML = `
        <div class="aggregated-summary">
            <h4>Summary</h4>
            <p>${aggregated.summary || 'No summary available'}</p>
        </div>

        <div class="aggregated-approach">
            <h4>Recommended Approach</h4>
            <div>${formatMarkdown(aggregated.best_approach || 'No approach available')}</div>
        </div>

        <div class="aggregated-metrics">
            <div class="metric-card">
                <div class="metric-value">${Math.round((aggregated.confidence || 0) * 100)}%</div>
                <div class="metric-label">Confidence</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Object.keys(aggregated.service_contributions || {}).length}</div>
                <div class="metric-label">Services Used</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(aggregated.cost?.actual || 0).toFixed(4)}</div>
                <div class="metric-label">Cost (USD)</div>
            </div>
        </div>
    `;
}

function displayIndividualResponses(responses) {
    Elements.individualResponses.innerHTML = '';

    responses.forEach(response => {
        const responseCard = document.createElement('div');
        responseCard.className = 'response-card';
        responseCard.innerHTML = `
            <div class="response-header">
                <div class="response-service">
                    <span class="response-service-name">${formatServiceName(response.service_name)}</span>
                    <span class="response-confidence">${Math.round((response.confidence || 0) * 100)}% confidence</span>
                </div>
                <div class="response-meta">
                    <span>⏱️ ${((response.response_time_ms || 0) / 1000).toFixed(1)}s</span>
                    <span>💰 ${(response.cost_usd || 0).toFixed(4)} USD</span>
                </div>
            </div>
            <div class="response-content">
                ${formatMarkdown(response.processed_response?.response || response.raw_response || 'No response available')}
            </div>
        `;
        Elements.individualResponses.appendChild(responseCard);
    });
}

function displayGeneratedCode(files) {
    Elements.generatedCode.innerHTML = '';

    if (!files || files.length === 0) {
        Elements.generatedCode.innerHTML = '<p>No code files were generated.</p>';
        return;
    }

    files.forEach(file => {
        const codeFile = document.createElement('div');
        codeFile.className = 'code-file';
        codeFile.innerHTML = `
            <div class="code-file-header">
                <span class="code-file-name">${file.filename}</span>
                <div class="code-file-actions">
                    <button class="copy-btn" onclick="copyToClipboard('${file.filename}', this)">Copy</button>
                    <button class="copy-btn" onclick="downloadFile('${file.filename}', '${escapeHtml(file.content)}', '${file.language}')">Download</button>
                </div>
            </div>
            <div class="code-block">
                <div class="code-header">
                    <span class="code-language">${file.language}</span>
                </div>
                <div class="code-content">
                    <pre><code>${escapeHtml(file.content)}</code></pre>
                </div>
            </div>
            ${file.description ? `<p style="margin-top: 1rem; color: var(--text-secondary); font-size: var(--font-size-sm);">${file.description}</p>` : ''}
        `;
        Elements.generatedCode.appendChild(codeFile);
    });
}

function displayImplementationGuide(guide) {
    Elements.implementationGuide.innerHTML = `
        <div class="guide-section">
            <h4>Overview</h4>
            <p>${guide.overview || 'No overview available'}</p>
        </div>

        <div class="guide-section">
            <h4>Prerequisites</h4>
            ${guide.prerequisites && guide.prerequisites.length > 0 ? `
                <ul>
                    ${guide.prerequisites.map(prereq => `
                        <li>
                            <div class="prerequisite-item">
                                <span class="prerequisite-icon">${prereq.type.charAt(0).toUpperCase()}</span>
                                <div>
                                    <strong>${prereq.name}</strong>
                                    <p style="margin: 0.25rem 0; color: var(--text-secondary); font-size: var(--font-size-sm);">${prereq.description}</p>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p>No prerequisites specified.</p>'}
        </div>

        <div class="guide-section">
            <h4>Implementation Steps</h4>
            ${guide.steps && guide.steps.length > 0 ? `
                <div class="implementation-steps">
                    ${guide.steps.map(step => `
                        <div class="implementation-step">
                            <div class="step-number">${step.step}</div>
                            <div class="step-content">
                                <div class="step-title">${step.title}</div>
                                <div class="step-description">${step.description}</div>
                                ${step.commands && step.commands.length > 0 ? `
                                    <div class="step-commands">
                                        <code>${step.commands.join('<br>')}</code>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p>No implementation steps provided.</p>'}
        </div>

        <div class="guide-section">
            <h4>Run Commands</h4>
            <div class="run-commands">
                <div class="command-list">
                    ${guide.run_commands && guide.run_commands.length > 0 ?
                        guide.run_commands.map(cmd => `<code>${escapeHtml(cmd)}</code>`).join('') :
                        '<p>No specific run commands provided.</p>'
                    }
                </div>
            </div>
        </div>

        <div class="guide-section">
            <h4>Expected Output</h4>
            <p>${guide.expected_output || 'No expected output specified.'}</p>
        </div>

        ${guide.troubleshooting && guide.troubleshooting.length > 0 ? `
            <div class="guide-section">
                <h4>Troubleshooting</h4>
                <ul>
                    ${guide.troubleshooting.map(item => `
                        <li>
                            <strong>${item.issue}:</strong> ${item.solution}
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}

        ${guide.next_steps && guide.next_steps.length > 0 ? `
            <div class="guide-section">
                <h4>Next Steps</h4>
                <ul>
                    ${guide.next_steps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

function showResults() {
    Elements.resultsSection.style.display = 'block';
    Elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function handleTabSwitch(e) {
    const tabName = e.target.dataset.tab;
    switchTab(tabName);
}

function switchTab(tabName) {
    // Update tab buttons
    Elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panes
    Elements.tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
}

function startNewQuery() {
    // Reset state
    AppState.currentQuery = null;
    AppState.currentResults = null;

    // Reset UI
    clearQuery();
    hideResults();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Focus on input
    Elements.queryInput.focus();
}

function hideResults() {
    Elements.resultsSection.style.display = 'none';
}

async function exportResults() {
    if (!AppState.currentResults) {
        showToast('No results to export', 'warning');
        return;
    }

    try {
        const exportFormat = await showExportDialog();
        if (!exportFormat) return;

        let content, filename, mimeType;

        switch (exportFormat) {
            case 'markdown':
                content = generateMarkdownExport(AppState.currentResults);
                filename = 'ai-aggregator-results.md';
                mimeType = 'text/markdown';
                break;
            case 'json':
                content = JSON.stringify(AppState.currentResults, null, 2);
                filename = 'ai-aggregator-results.json';
                mimeType = 'application/json';
                break;
            case 'html':
                content = generateHTMLExport(AppState.currentResults);
                filename = 'ai-aggregator-results.html';
                mimeType = 'text/html';
                break;
            default:
                return;
        }

        downloadFile(filename, content, mimeType);
        showToast('Results exported successfully', 'success');

    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export results', 'error');
    }
}

function showExportDialog() {
    return new Promise((resolve) => {
        const formats = ['markdown', 'json', 'html'];
        const formatLabels = {
            'markdown': 'Markdown (.md)',
            'json': 'JSON (.json)',
            'html': 'HTML (.html)'
        };

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Export Results</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Select export format:</p>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0;">
                        ${formats.map(format => `
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="radio" name="exportFormat" value="${format}" ${format === 'markdown' ? 'checked' : ''}>
                                ${formatLabels[format]}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="confirmExport">Export</button>
                    <button class="btn btn-secondary" id="cancelExport">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const confirmBtn = modal.querySelector('#confirmExport');
        const cancelBtn = modal.querySelector('#cancelExport');
        const closeBtn = modal.querySelector('.modal-close');

        const cleanup = () => {
            document.body.removeChild(modal);
        };

        confirmBtn.addEventListener('click', () => {
            const selectedFormat = modal.querySelector('input[name="exportFormat"]:checked').value;
            cleanup();
            resolve(selectedFormat);
        });

        [cancelBtn, closeBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(null);
            }
        });
    });
}

// History Management
function toggleHistory() {
    const isVisible = Elements.historySection.style.display !== 'none';
    Elements.historySection.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        Elements.historySection.scrollIntoView({ behavior: 'smooth' });
    }
}

function loadHistory() {
    const savedHistory = localStorage.getItem('queryHistory');
    if (savedHistory) {
        try {
            AppState.history = JSON.parse(savedHistory);
            renderHistory();
        } catch (error) {
            console.error('Failed to load history:', error);
            AppState.history = [];
        }
    }
}

function addToHistory(results) {
    const historyItem = {
        id: results.query_id,
        query: results.query,
        query_type: results.query_type,
        services_used: results.services_used,
        status: results.status,
        created_at: results.timing.created_at,
        actual_cost: results.cost?.actual || 0
    };

    // Add to beginning of history
    AppState.history.unshift(historyItem);

    // Limit to 50 items
    AppState.history = AppState.history.slice(0, 50);

    // Save to localStorage
    localStorage.setItem('queryHistory', JSON.stringify(AppState.history));

    // Render history
    renderHistory();
}

function renderHistory(historyItems = AppState.history) {
    if (historyItems.length === 0) {
        Elements.historyList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No query history yet.</p>';
        return;
    }

    Elements.historyList.innerHTML = historyItems.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-item-header">
                <div class="history-item-query">${escapeHtml(item.query)}</div>
                <div class="history-item-meta">
                    <span>${formatQueryType(item.query_type)}</span>
                    <span>${item.services_used.length} services</span>
                    <span>${formatDate(item.created_at)}</span>
                </div>
            </div>
            <div class="history-item-actions">
                <button class="history-item-action" onclick="viewHistoryItem('${item.id}')">View</button>
                <button class="history-item-action" onclick="deleteHistoryItem('${item.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function searchHistory(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredHistory = AppState.history.filter(item =>
        item.query.toLowerCase().includes(searchTerm) ||
        item.query_type.toLowerCase().includes(searchTerm)
    );
    renderHistory(filteredHistory);
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all query history? This action cannot be undone.')) {
        AppState.history = [];
        localStorage.removeItem('queryHistory');
        renderHistory();
        showToast('History cleared', 'success');
    }
}

function viewHistoryItem(id) {
    const item = AppState.history.find(h => h.id === id);
    if (item) {
        // Load the results for this item
        loadResults(id);
        toggleHistory();
    }
}

function deleteHistoryItem(id) {
    AppState.history = AppState.history.filter(h => h.id !== id);
    localStorage.setItem('queryHistory', JSON.stringify(AppState.history));
    renderHistory();
    showToast('Item removed from history', 'success');
}

// Theme Management
function toggleTheme() {
    const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
    AppState.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = Elements.themeToggle.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Focus query input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        Elements.queryInput.focus();
    }

    // Ctrl/Cmd + Enter: Submit query
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!Elements.analyzeBtn.disabled) {
            analyzeQuery();
        }
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
        if (Elements.serviceModal.classList.contains('active')) {
            closeModal();
        }
        if (Elements.historySection.style.display !== 'none') {
            toggleHistory();
        }
    }
}

// Utility Functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatQueryType(type) {
    const types = {
        'web_development': 'Web Development',
        'data_analysis': 'Data Analysis',
        'writing': 'Writing',
        'debugging': 'Debugging',
        'real_time_research': 'Research',
        'general': 'General'
    };
    return types[type] || type;
}

function formatServiceName(service) {
    const names = {
        'chatgpt': 'ChatGPT',
        'deepseek': 'DeepSeek',
        'perplexity': 'Perplexity',
        'copilot': 'Microsoft Copilot'
    };
    return names[service] || service;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

function formatMarkdown(text) {
    if (!text) return '';

    // Simple markdown formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<div class="code-block">
                <div class="code-header">
                    <span class="code-language">${lang || 'text'}</span>
                </div>
                <div class="code-content">
                    <pre><code>${escapeHtml(code.trim())}</code></pre>
                </div>
            </div>`;
        })
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show/Hide loading states
function showLoading(button = null) {
    if (button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        if (btnText && btnLoader) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
        }
        button.disabled = true;
    } else {
        Elements.loadingOverlay.style.display = 'flex';
    }
}

function hideLoading(button = null) {
    if (button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        if (btnText && btnLoader) {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
        button.disabled = false;
    } else {
        Elements.loadingOverlay.style.display = 'none';
    }
}

// Toast notifications
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-message">${message}</div>
    `;

    Elements.toastContainer.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);

    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}

// API Health Check
async function checkAPIHealth() {
    try {
        const response = await apiRequest('/health');
        if (!response.success) {
            showToast('API service may be unavailable', 'warning');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        showToast('Unable to connect to API service', 'error');
    }
}