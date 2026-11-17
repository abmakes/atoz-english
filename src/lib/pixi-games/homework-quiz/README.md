# Homework quiz

Single-player homework for a multiple-choice quiz the teacher already created. Students open a class link, answer every question, and get a percentage. They can retry. After one finished try they can play the challenge.

This screen owns one Pixi `Application`. It does not use `GameContainer` or RuleEngine, because there are no teams and the score is graded on the server.

## Homework

No timer and no lives. The correct answer stays hidden until the whole try is submitted. The result is the percentage, the misses, and a chance to try again.

## Challenge

Same questions, repeating, without showing the right answer.

- 1 life. A miss or a timeout costs it. At 0 the run ends.
- At 20 correct, one extra life, once.
- 15 seconds through 49 correct. From 50, every 10 correct takes 2 seconds off: 13, 11, 9, 7, then 5 seconds from 90 to 99.
- The frame shakes while the limit is under 10 seconds.
- Flames start at 30 correct and change color every 10. A miss does not put them out.
- At 100 correct the run ends (Mega Chad). Those runs rank by time to 100. Everyone else ranks by how many they got right.

Rules live in [`src/lib/homework/rules.ts`](../../homework/rules.ts). The server is the scorekeeper.
