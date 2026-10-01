/**
 * done -- the closing report, from Rumi's own doctor.
 *
 * Deliberately the same check `rumi doctor` runs, so this screen and the terminal
 * can never disagree. Its vocabulary is the doctor's too: probes come back
 * `pass`, `fail` or `skip`, and `skip` means "nothing configured to test yet",
 * which is a different thing from a failure and is shown as one.
 *
 * @module steps/done
 */

import { get } from '../api.js';
import { el, clear, verdict } from '../dom.js';

export async function render(host, context) {
  clear(host);

  if (!context.capabilities.probes) {
    host.append(el('p', { class: 'field__hint', text: 'Press Start in the Pinokio sidebar when you are ready.' }));
    return;
  }

  host.append(verdict('busy', 'Checking everything…'));

  try {
    const report = await get('/api/doctor');
    clear(host);
    host.append(tally(report), ...findings(report));
    if (report.ok) context.markDone('done');
  } catch (error) {
    clear(host);
    host.append(verdict('bad', error.message));
  }
}

function tally(report) {
  const probes = report.probeResults || [];
  const tested = probes.filter((row) => row.status !== 'skip');
  const passing = probes.filter((row) => row.status === 'pass').length;
  const featuresOn = (report.featureResults || []).filter((row) => row.status === 'on').length;

  return el('div', { class: 'tally' }, [
    stat(`${passing}/${tested.length || probes.length}`, 'services answering'),
    stat(String(featuresOn), 'features switched on'),
    stat(report.ok ? 'Ready' : 'Not yet', 'overall'),
  ]);
}

function stat(value, label) {
  return el('div', { class: 'tally__item' }, [
    el('div', { class: 'tally__n', text: value }),
    el('div', { class: 'tally__l', text: label }),
  ]);
}

function findings(report) {
  const notices = [];
  const missing = report.missingRequired || [];
  const failing = (report.probeResults || []).filter((row) => row.status === 'fail');

  if (missing.length) {
    notices.push(problem('Some required settings are still empty.', missing, (key) => key));
  }
  if (failing.length) {
    notices.push(problem('Some services are not answering.', failing,
      (row) => `${row.name}: ${row.detail || 'no detail'}`));
  }
  if (!notices.length) {
    notices.push(el('div', { class: 'notice notice--ok' }, [
      el('b', { text: 'Everything Rumi needs is answering.' }),
      el('p', { text: 'Press Start in the Pinokio sidebar, then message Rumi from your second phone.' }),
    ]));
  }
  return notices;
}

function problem(heading, items, describe) {
  return el('div', { class: 'notice notice--bad' }, [
    el('b', { text: heading }),
    el('ul', {}, items.map((item) => el('li', { text: describe(item) }))),
  ]);
}
