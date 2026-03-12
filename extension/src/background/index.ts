import type { MessageType, JobContext, GenerationResult } from '../types';
import { getProfile } from '../store/profile';

// Background service worker — message bus + companion API calls

chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  if (message.type === 'GENERATE') {
    handleGenerate(message.payload).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true; // keep channel open for async
  }
  if (message.type === 'TOGGLE_SIDEBAR') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_SIDEBAR' });
      }
    });
  }
  if (message.type === 'OPEN_SIDEBAR') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_SIDEBAR' });
      }
    });
  }
  if (message.type === 'START_COMPANION') {
    chrome.runtime.sendNativeMessage('com.openapply.companion', { text: "ping" }, (res) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ ok: true, res });
      }
    });
    return true; // Keep channel open
  }
  return false;
});

async function handleGenerate(job: JobContext): Promise<GenerationResult> {
  const profile = await getProfile();
  const companionUrl = profile.companionUrl || 'http://localhost:7523';

  // 1. Scrape + structure the job description
  const scrapeRes = await fetch(`${companionUrl}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: job.description, url: job.url }),
  });
  if (!scrapeRes.ok) throw new Error('Companion /scrape failed');
  const structured = await scrapeRes.json();

  // 2. Generate resume, cover letter, feedback
  const tailorRes = await fetch(`${companionUrl}/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job: { ...job, ...structured },
      profile: {
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: profile.linkedin,
        github: profile.github,
        portfolio: profile.portfolio,
        workAuth: profile.workAuthorization,
        apiKey: profile.apiKey,
        llmProvider: profile.llmProvider,
      },
    }),
  });
  if (!tailorRes.ok) {
    const err = await tailorRes.text();
    throw new Error(`Companion /tailor failed: ${err}`);
  }
  return tailorRes.json();
}
