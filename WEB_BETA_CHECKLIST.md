# Web Beta Checklist

## Release gate

- [x] Product clearly distinguishes local coach estimates from online AI.
- [x] Irrelevant answers trigger clarification instead of silently advancing.
- [x] Practice and challenge modes work.
- [x] Local history, streaks, phrasebook, feedback, reporting and privacy pages exist.
- [x] Static assets, API status, feedback endpoint and security headers pass automated checks.
- [x] Eight balanced scenarios and sixteen full practice/challenge journeys pass automated checks.
- [x] Calm responsive UI replaces the high-stimulation incident-dashboard design.
- [x] Docker, Render Blueprint and GitHub release checks are ready.
- [x] AI provider key remains server-side.
- [x] Online AI has basic input blocking, safe-response instructions and an in-app report path.
- [ ] Test microphone permissions on a real iPhone Safari device.
- [ ] Test microphone permissions on a real Android Chrome device.
- [ ] Deploy to an HTTPS domain.
- [ ] Confirm production AI provider retention and training settings before enabling online AI.
- [ ] Replace file-based feedback storage with a managed database before meaningful scale.

## First user test

Recruit 10 to 20 Chinese international students currently living in an English-speaking country.

Ask each tester to:

1. Complete one scene in practice mode.
2. Complete another scene in challenge mode.
3. Explain one score they agree with and one they disagree with.
4. Save one phrase they would actually use.
5. Return within seven days without being reminded, if they genuinely find it useful.

Do not explain how the evaluator works before the first scene. Observe where users misunderstand the product.

## Decisions based on evidence

Continue building if:

- at least 60% complete two scenes;
- at least 40% return within seven days;
- users can explain why the feedback is useful;
- the strongest complaints can be fixed through better rubrics or scenarios.

Pause or reposition if:

- users mainly click suggested replies and do not freely answer;
- users enjoy the jokes but do not return;
- feedback is not meaningfully more useful than a general AI chat prompt;
- users consistently distrust the evaluation even after explanations.

## Operating commands

Run the service:

```powershell
node local-server.mjs
```

Run automated checks:

```powershell
node --check app.js
node --check local-server.mjs
node tests/smoke-test.mjs
node tests/interaction-test.mjs
node tests/rubric-test.mjs
node tests/ui-test.mjs
node tests/production-test.mjs
node tests/journey-test.mjs
node tests/accessibility-test.mjs
node tests/server-test.mjs
```

Summarise public-alpha events and feedback:

```powershell
node scripts/alpha-report.mjs
```
