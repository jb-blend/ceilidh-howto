#!/usr/bin/env python3
"""Create a public leaderboard.json from GitHub Issues without third-party services.

Entries are untrusted player submissions: never execute issue text. Only a strict
subset of fields are accepted; max one best score per GitHub account.
"""
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = '<!-- ceilidh-incident-score-v1 -->'
PREFIX = '[CEILIDH SCORE]'
ALLOWED_GRADES = {'S', 'A', 'B', 'C', 'D', 'F'}


def get_field(text, label):
    match = re.search(r'^' + re.escape(label) + r':\s*(.+)$', text, flags=re.M)
    return match.group(1).strip() if match else ''


def parse_issue(issue):
    if not isinstance(issue, dict) or issue.get('pull_request'):
        return None
    body = issue.get('body') or ''
    if not isinstance(body, str) or MARKER not in body or not str(issue.get('title') or '').startswith(PREFIX):
        return None
    try:
        score_raw = get_field(body, 'Score')
        accuracy_raw = get_field(body, 'Accuracy')
        beat_raw = get_field(body, 'Finish beat')
        score = int(score_raw)
        accuracy = float(accuracy_raw)
        beat = float(beat_raw)
    except ValueError:
        return None
    name = get_field(body, 'Name')
    grade = get_field(body, 'Grade')
    user = issue.get('user') or {}
    github = str(user.get('login') or '').strip()
    if not 2 <= len(name) <= 22 or any(ord(c) < 32 or c in '<>\r\n' for c in name):
        return None
    if grade not in ALLOWED_GRADES or score < 0 or score > 1_000_000:
        return None
    if not 0 <= accuracy <= 100 or not 0 <= beat <= 999:
        return None
    if not github:
        return None
    return {'name': name, 'score': score, 'grade': grade,
            'accuracy': accuracy, 'finishBeat': beat, 'github': github,
            'date': str(issue.get('created_at') or ''),
            'url': str(issue.get('html_url') or '')}


def fetch_issues(repo, token):
    issues = []
    for page in range(1, 11):  # at most 1,000 recent issues; plenty for the party
        endpoint = f'https://api.github.com/repos/{repo}/issues?state=all&per_page=100&page={page}&sort=created&direction=desc'
        request = urllib.request.Request(endpoint, headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': f'Bearer {token}',
            'User-Agent': 'ceilidh-incident-leaderboard/1.0'})
        with urllib.request.urlopen(request, timeout=25) as response:
            batch = json.load(response)
        if not isinstance(batch, list):
            raise ValueError('Unexpected Issues API response')
        issues.extend(batch)
        if len(batch) < 100:
            break
    return issues


def build(issues, repo):
    best = {}
    for issue in issues:
        entry = parse_issue(issue)
        if not entry:
            continue
        key = entry['github'].lower()
        if key not in best or entry['score'] > best[key]['score']:
            best[key] = entry
    scores = sorted(best.values(), key=lambda item: (-item['score'], item['date']))[:25]
    return {'schema': 1, 'sourceRepo': repo, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'entries': scores}


def main():
    repo = os.environ.get('GITHUB_REPOSITORY', '').strip()
    fixture = os.environ.get('CEILIDH_FIXTURE', '')
    if fixture:
        issues = json.loads(Path(fixture).read_text(encoding='utf-8'))
        repo = repo or 'sample/ceilidh-game'
    else:
        token = os.environ.get('GH_TOKEN', '')
        if not token or not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repo):
            sys.exit('GH_TOKEN and GITHUB_REPOSITORY are required inside GitHub Actions.')
        issues = fetch_issues(repo, token)
    result = build(issues, repo)
    out = ROOT / 'site' / 'leaderboard.json'
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Generated {out} with {len(result["entries"])} validated player scores.')


if __name__ == '__main__':
    main()
