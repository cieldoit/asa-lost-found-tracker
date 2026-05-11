// ============================================================
// SPA ROUTER - Complete with all pages
// ============================================================

const SPA = {
    config: {
        debug: true,
        defaultRoute: '/',
        routes: {
            '/': {
                title: 'ASA - Lost and Found Tracking System',
                template: 'home',
                authRequired: false
            },
            '/index': {
                title: 'ASA - Lost and Found Tracking System',
                template: 'home',
                authRequired: false
            },
            '/login': {
                title: 'Login - ASA Lost and Found',
                template: 'login',
                authRequired: false
            },
            '/selection': {
                title: 'Select Role - ASA Lost and Found',
                template: 'selection',
                authRequired: false
            },
            '/signup/student': {
                title: 'Student Registration - ASA Lost and Found',
                template: 'signup-student',
                authRequired: false
            },
            '/signup/staff': {
                title: 'Staff Registration - ASA Lost and Found',
                template: 'signup-staff',
                authRequired: false
            },
            '/signup/visitor': {
                title: 'Visitor Registration - ASA Lost and Found',
                template: 'signup-visitor',
                authRequired: false
            },
            '/student': {
                title: 'Student Dashboard - ASA Lost and Found',
                template: 'student',
                authRequired: false
            },
            '/staff': {
                title: 'Staff Dashboard - ASA Lost and Found',
                template: 'staff',
                authRequired: false
            },
            '/visitor': {
                title: 'Visitor Dashboard - ASA Lost and Found',
                template: 'visitor',
                authRequired: false
            },
            '/admin': {
                title: 'Admin Dashboard - ASA Lost and Found',
                template: 'admin',
                authRequired: false
            },
            '/guest': {
                title: 'Browse as Guest - ASA Lost and Found',
                template: 'guest',
                authRequired: false
            },
            '/dashboard': {
                title: 'Dashboard - ASA Lost and Found',
                template: 'dashboard',
                authRequired: false
            },
            '/privacy': {
                title: 'Privacy Policy - ASA Lost and Found',
                template: 'privacy',
                authRequired: false
            },
            '/terms': {
                title: 'Terms of Service - ASA Lost and Found',
                template: 'privacy',
                authRequired: false
            }
        }
    },

    templates: {},
    currentRoute: null,
    isLoading: false,
    currentStyles: new Set(),

    init: function() {
        this.log('SPA Initializing...');
        this.setupNavigation();
        
        window.addEventListener('popstate', (event) => {
            this.log('Popstate triggered:', window.location.pathname);
            this.loadRoute(window.location.pathname);
        });
        
        const initialPath = window.location.pathname;
        this.loadRoute(initialPath);
        this.log('SPA Initialized');
    },

    setupNavigation: function() {
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            let href = link.getAttribute('href');
            
            if (!href || 
                href.startsWith('http') || 
                href.startsWith('javascript:') ||
                href.includes('mailto:') ||
                href.includes('tel:')) {
                return;
            }
            
            // Let anchor links work normally
            if (href.startsWith('#')) {
                return;
            }
            
            // Let HTML file links work normally (full page load)
            // This includes index.html and any other .html files
            if (href.endsWith('.html') || 
                href.includes('.html') || 
                href === '/index.html' || 
                href === 'index.html' ||
                href === '/' ||
                href === '') {
                // Allow normal navigation for HTML files and root
                return;
            }
            
            e.preventDefault();
            
            let path = href;
            if (path.startsWith(window.location.origin)) {
                path = path.replace(window.location.origin, '');
            }
            
            const cleanPath = path.split('?')[0].split('#')[0];
            
            if (cleanPath === '' || cleanPath === '/index.html') {
                this.navigateTo('/');
            } else {
                this.navigateTo(cleanPath);
            }
        });
    },

    navigateTo: function(path, addToHistory = true) {
        this.log('Navigating to:', path);
        
        if (!this.config.routes[path] && path !== '/') {
            this.log('Route not found:', path);
            path = this.config.defaultRoute;
        }
        
        if (addToHistory) {
            window.history.pushState({}, '', path);
        }
        
        this.loadRoute(path);
    },

    loadRoute: async function(path) {
        if (this.isLoading) return;
        
        const route = this.config.routes[path];
        if (!route && path !== '/') {
            console.error('Route config not found for:', path);
            return;
        }
        
        this.isLoading = true;
        this.currentRoute = path;
        this.showLoading();
        
        try {
            const fullHtml = await this.loadFullPage(route.template);
            this.replacePageContent(fullHtml, route);
            this.log('Route loaded successfully:', path);
        } catch (error) {
            console.error('Error loading route:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    },

    loadFullPage: async function(templateName) {
        const templateMap = {
            'home': '/index.html',
            'login': '/login/landing.html',
            'selection': '/login/selection.html',
            'signup-student': '/login/signupStud.html',
            'signup-staff': '/login/signupStaff.html',
            'signup-visitor': '/login/signupVisitor.html',
            'student': '/user/student.html',
            'staff': '/user/staff.html',
            'visitor': '/user/visitor.html',
            'admin': '/user/admin.html',
            'dashboard': '/user/dashboard .html',
            'guest': '/user/guest.html',
            'privacy': '/ASA_details/info.html'
        };
        
        const filePath = templateMap[templateName];
        if (!filePath) return '<div>Content not found</div>';
        
        const cacheKey = `${templateName}_full`;
        if (this.templates[cacheKey]) {
            this.log('Using cached full page:', templateName);
            return this.templates[cacheKey];
        }
        
        try {
            this.log('Fetching full page:', filePath);
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            this.templates[cacheKey] = html;
            return html;
        } catch (error) {
            console.error('Failed to load page:', error);
            return '<div>Error loading content</div>';
        }
    },

    replacePageContent: function(fullHtml, route) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullHtml, 'text/html');
        
        // SPECIAL: For privacy page, load as-is
        if (route.template === 'privacy') {
            this.log('Loading privacy page - preserving original design');
            
            const mainNav = document.querySelector('nav');
            if (mainNav) {
                mainNav.style.display = 'none';
            }
            
            let contentContainer = document.getElementById('spa-content-container');
            if (!contentContainer) {
                contentContainer = document.createElement('div');
                contentContainer.id = 'spa-content-container';
                document.body.appendChild(contentContainer);
            }
            
            contentContainer.innerHTML = doc.body.innerHTML;
            document.title = route.title;
            window.scrollTo(0, 0);
            
            setTimeout(() => {
                this.executePrivacyScripts(doc);
            }, 10);
            
            this.triggerRouteChange(this.currentRoute);
            return;
        }
        
        // For all other pages
        let newBodyContent = doc.body.innerHTML;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newBodyContent;
        
        const loadedNavs = tempDiv.querySelectorAll('nav');
        loadedNavs.forEach(nav => nav.remove());
        
        const loginLinks = tempDiv.querySelectorAll('.log-in-link, .log-in');
        loginLinks.forEach(link => {
            if (!link.closest('nav')) {
                link.remove();
            }
        });
        
        newBodyContent = tempDiv.innerHTML;
        this.cleanupStyles();
        
        let contentContainer = document.getElementById('spa-content-container');
        if (!contentContainer) {
            contentContainer = document.createElement('div');
            contentContainer.id = 'spa-content-container';
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.innerHTML = '';
                mainElement.appendChild(contentContainer);
            } else {
                const nav = document.querySelector('nav');
                if (nav && nav.nextSibling) {
                    document.body.insertBefore(contentContainer, nav.nextSibling);
                } else {
                    document.body.appendChild(contentContainer);
                }
            }
        }
        
        // Show/Hide main navigation based on page type
        const hideNavPages = ['login', 'selection', 'signup-student', 'signup-staff', 'signup-visitor', 'guest', 'student', 'staff', 'visitor', 'admin', 'dashboard'];
        const mainNav = document.querySelector('nav');
        
        if (mainNav) {
            if (hideNavPages.includes(route.template)) {
                mainNav.style.display = 'none';
            } else {
                mainNav.style.display = 'flex';
                mainNav.style.position = 'fixed';
                mainNav.style.top = '0';
            }
        }
        
        // Add styles
        const newStyles = doc.querySelectorAll('style');
        newStyles.forEach(style => {
            const styleText = style.textContent;
            if (!this.currentStyles.has(styleText)) {
                const newStyle = document.createElement('style');
                newStyle.textContent = styleText;
                document.head.appendChild(newStyle);
                this.currentStyles.add(styleText);
            }
        });
        
        contentContainer.innerHTML = newBodyContent;
        document.title = route.title;
        window.scrollTo(0, 0);
        
        setTimeout(() => {
            this.executeScripts(doc);
        }, 10);
        
        this.triggerRouteChange(this.currentRoute);
    },
    
    executePrivacyScripts: function(doc) {
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(oldScript => {
            if (oldScript.src && oldScript.src.includes('spa-router.js')) return;
            if (oldScript.textContent && oldScript.textContent.includes('SPA')) return;
            
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
        });
    },

    cleanupStyles: function() {
        const stylesToRemove = [];
        document.querySelectorAll('style').forEach(style => {
            const styleText = style.textContent;
            if (styleText.includes('spa-loading') || styleText.includes('SPA')) return;
            if (this.currentStyles.has(styleText)) {
                stylesToRemove.push(style);
            }
        });
        stylesToRemove.forEach(style => {
            style.remove();
            this.currentStyles.delete(style.textContent);
        });
    },

    executeScripts: function(doc) {
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(oldScript => {
            if (oldScript.src && oldScript.src.includes('spa-router.js')) return;
            if (oldScript.textContent && oldScript.textContent.includes('SPA')) return;
            
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
        });
    },

    showLoading: function() {
        let loadingEl = document.getElementById('spa-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'spa-loading';
            loadingEl.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                z-index: 10001;
                font-size: 14px;
                font-family: 'Poppins', sans-serif;
            `;
            loadingEl.textContent = 'Loading...';
            document.body.appendChild(loadingEl);
        }
        loadingEl.style.display = 'block';
    },

    hideLoading: function() {
        const loadingEl = document.getElementById('spa-loading');
        if (loadingEl) loadingEl.style.display = 'none';
    },

    showError: function() {
        const contentContainer = document.getElementById('spa-content-container');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h2>Something went wrong</h2>
                    <p>Failed to load the page. Please try again.</p>
                    <a href="/" style="color: green;">Go back home</a>
                </div>
            `;
        }
    },

    triggerRouteChange: function(path) {
        const event = new CustomEvent('spa:route-change', { detail: { path: path } });
        document.dispatchEvent(event);
    },

    log: function(...args) {
        if (this.config.debug) {
            console.log('[SPA]', ...args);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SPA.init();
});

window.SPA = SPA;