# Homework quiz

Single-player homework for a multiple-choice quiz the teacher already created. Students open a class link, answer every question, and get a percentage. They can retry. After one finished try they can play the challenge.

This screen owns one Pixi `Application`. It does not use `GameContainer` or RuleEngine, because there are no teams and the score is graded on the server. The scene is the quiz theme: Clouds, Forest, or Dark Sea, the same backgrounds as the classroom quiz.

## Homework

No timer and no lives. A tap turns green or red immediately, the card fades out, and the next picture fades in. Answers stay on this device until the try is submitted or the page closes, then they are saved once. A single bar shows how far through the questions they are. The full miss list is still shown after the try is submitted.

## Challenge

Same questions, repeating. The run stays on this device. The next picture is loaded ahead of time, and the database is written once, when the run ends.

- 1 life. A miss or a timeout costs it. At 0 the run ends.
- At 20 correct, one extra life, once.
- 15 seconds through 49 correct. From 50, every 10 correct takes 2 seconds off: 13, 11, 9, 7, then 5 seconds from 90 to 99.
- The frame shakes while the limit is under 10 seconds.
- Flames start at 30 correct and change color every 10. A miss does not put them out.
- At 100 correct the run ends (Mega Chad). Those runs rank by time to 100. Everyone else ranks by how many they got right.

Rules live in [`src/lib/homework/rules.ts`](../../homework/rules.ts). The server is the scorekeeper.
