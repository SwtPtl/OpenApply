// Content script — injected into every page
// Responsibility: scrape job text, inject sidebar iframe, relay messages

import type { JobContext, MessageType } from '../types';

let sidebarIframe: HTMLIFrameElement | null = null;
let sidebarVisible = false;

// ─── Message listener ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
  if (message.type === 'TOGGLE_SIDEBAR') {
    toggleSidebar();
    sendResponse({ ok: true });
  }
  if (message.type === 'OPEN_SIDEBAR') {
    openSidebar();
    sendResponse({ ok: true });
  }
  return true; // Keep message channel open for async response if needed
});

// ─── Sidebar injection ──────────────────────────────────────────────────────
function injectSidebar() {
  if (sidebarIframe) return;

  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'openapply-sidebar';
  sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
  Object.assign(sidebarIframe.style, {
    position: 'fixed',
    top: '0',
    right: '-440px',
    width: '440px',
    height: '100vh',
    zIndex: '2147483647',
    border: 'none',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
    transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)',
    borderRadius: '16px 0 0 16px',
  });

  document.body.appendChild(sidebarIframe);
}

function openSidebar() {
  injectSidebar();
  setTimeout(() => {
    if (sidebarIframe) {
      sidebarIframe.style.right = '0';
      sidebarVisible = true;
      // Send job context to sidebar
      const job = scrapeJobContext();
      sidebarIframe.contentWindow?.postMessage({ type: 'JOB_CONTEXT', payload: job }, '*');
    }
  }, 50);
}

function toggleSidebar() {
  if (!sidebarIframe) return openSidebar();
  sidebarVisible = !sidebarVisible;
  sidebarIframe.style.right = sidebarVisible ? '0' : '-440px';
  if (sidebarVisible) {
    const job = scrapeJobContext();
    sidebarIframe.contentWindow?.postMessage({ type: 'JOB_CONTEXT', payload: job }, '*');
  }
}

// ─── Job scraper ────────────────────────────────────────────────────────────
function scrapeJobContext(): JobContext {
  const url = window.location.href;

  // Priority 1: Known ATS selectors
  const atsSelectors: Record<string, string[]> = {
    greenhouse: ['.job-post', '#job_description', '.job__description'],
    lever: ['.posting-headline', '.content', '.posting'],
    ashby: ['[data-qa="job-description"]', '.ashby-job-posting'],
    workday: ['[data-automation-id="jobPostingDescription"]', '.job-description'],
    linkedin: ['.jobs-description', '.description__text'],
    indeed: ['#jobDescriptionText', '.jobsearch-jobDescriptionText'],
  };

  let descText = '';
  for (const selectors of Object.values(atsSelectors)) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim().length > 100) {
        descText = el.textContent.trim();
        break;
      }
    }
    if (descText) break;
  }

  // Priority 2: <main> or <article>
  if (!descText) {
    const main = document.querySelector('main') || document.querySelector('article');
    if (main && main.textContent) descText = main.textContent.trim();
  }

  // Priority 3: full body (trimmed to 8000 chars)
  if (!descText) {
    descText = document.body.innerText.substring(0, 8000);
  }

  // Extract title & company from meta or page title
  const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const pageTitle = document.title || '';
  const displayTitle = metaTitle || pageTitle;

  const metaCompany =
    document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    document.querySelector('.company-name, [data-company], .employer-name')?.textContent?.trim() ||
    '';

  // Detect ATS type from URL
  let atsType = 'unknown';
  if (url.includes('greenhouse.io')) atsType = 'greenhouse';
  else if (url.includes('lever.co')) atsType = 'lever';
  else if (url.includes('ashbyhq.com')) atsType = 'ashby';
  else if (url.includes('myworkdayjobs.com')) atsType = 'workday';
  else if (url.includes('linkedin.com')) atsType = 'linkedin';
  else if (url.includes('indeed.com')) atsType = 'indeed';

  return {
    title: displayTitle,
    company: metaCompany,
    description: descText,
    url,
    atsType,
  };
}

// ─── Listen for close messages from sidebar ─────────────────────────────────
window.addEventListener('message', (event) => {
  if (event.data?.type === 'CLOSE_SIDEBAR') {
    if (sidebarIframe) {
      sidebarIframe.style.right = '-440px';
      sidebarVisible = false;
    }
  }
  if (event.data?.type === 'REQUEST_JOB_CONTEXT') {
    const job = scrapeJobContext();
    sidebarIframe?.contentWindow?.postMessage({ type: 'JOB_CONTEXT', payload: job }, '*');
  }
});

export {};
