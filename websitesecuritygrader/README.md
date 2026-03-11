# Website Security Grader

A VS Code extension that scans a website codebase for common security vulnerabilities and gives it a grade. Point it at any project, run the command, and get a report back showing exactly what's wrong and where.

This project was built as part of a class project exploring the security risks of AI-generated code. The full write-up is here: [AI Website Security Grader — Project Report](https://docs.google.com/document/d/14htszkDSfpqigc6LEexLayQU7wzmRQ2KzM_XlfZNB_M/edit?usp=sharing)

---

## What It Does

The extension scans all the files in your open VS Code workspace and checks them against a set of hard-coded security rules. Each rule looks for a known bad pattern — things like hardcoded passwords, `eval()` calls, SQL queries built with string concatenation, and so on. Every match gets flagged as an issue with a severity score between 1 and 10. Those scores are summed up and converted into a letter grade (A through F), which gets displayed in a webview panel alongside the full list of issues.

### What It Checks For

| Category | Examples |
|---|---|
| Hardcoded secrets | `password = "..."`, `apiKey = "..."`, `token = "..."` |
| XSS | `.innerHTML =`, `eval()`, `document.write()`, `dangerouslySetInnerHTML` |
| SQL injection | String-concatenated queries, template literal interpolation in SQL |
| Insecure connections | `http://` URLs (non-localhost) |
| Command injection | `child_process` imports, `.exec()` calls |
| Weak cryptography | `Math.random()`, `md5()`, `sha1()` |
| Developer oversights | Security TODOs, commented-out passwords |

Issues are color-coded by severity in the report: **yellow** (1–3), **orange** (4–6), **red** (7–10).

### Grading Scale

The grade is based on the sum of all severity scores across detected issues:

| Total severity | Grade |
|---|---|
| 0 | A |
| 1 – 20 | B |
| 21 – 40 | C |
| 41 – 60 | D |
| 60+ | F |

---

## How to Use It

1. Open a project folder in VS Code
2. Press `Cmd+Shift+P` to open the command palette
3. Type **Generate Report** and hit Enter
4. A report panel will open with your grade and a full list of flagged issues

The scanner skips `node_modules`, `.git`, `out`, and `dist` folders automatically.

---

## Where the Project Is At

This is an MVP. It works — open a codebase, run the command, get a report. The rules are all regex-based static analysis, which means it's fast and doesn't require any external services, but it also has limits. It can produce false positives (flagging things that are actually fine in context) and it'll miss anything that doesn't match one of the hard-coded patterns.

The next big step would be layering in AI analysis on top of the regex scan, which would catch more complex vulnerabilities and reduce false positives. The groundwork for that is already in the codebase (`aiAPI.ts`) — it's just not wired up yet. Beyond that, there's room to expand the rule set, support more file types, and eventually publish the extension so anyone can use it.

---

## File Overview

```
src/
├── extension.ts          # command registration and file discovery
├── gradingAlgorithm.ts   # security rules and grading logic
├── reportGenerator.ts    # HTML report generation
└── aiAPI.ts              # AI analysis service (built, not yet active)
```
