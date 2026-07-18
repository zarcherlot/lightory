# Four-Point Race AI Tutor MVP Requirements

## Current Conclusion

This MVP is a STEM learning experience built around a real four-point robot race. The core value is not that a child says one sentence and the robot immediately runs. The core value is that an AI tutor and expert agents guide the child to discover the physics, engineering, mathematics, and science behind the game.

The existing `pad-robot-api-control-requirements.md` remains a lower-level Robot API reference. This document defines the product and education requirements for the next MVP.

## Product Positioning

Lightory should feel like an AI STEM tutor with a real robot lab.

- The child works toward a concrete game goal: complete a timed race through four points A, B, C, and D.
- The AI tutor is the main teaching agent and controls the learning rhythm.
- Expert agents are specialized teaching assistants with their own personalities, skills, tool boundaries, and knowledge focus.
- The robot is a real physical experiment device, not a mock and not a purely visual toy.
- The first MVP UI is Console-first. Frontend visualization can be improved later.
- Console content is for the child, not for developers.

The MVP should avoid two failure modes:

- A "one sentence to robot action" demo that hides the engineering thinking.
- A rigid scripted show where expert agents introduce themselves one by one.

## Core Scenario

The first scene starts from the child saying something like:

```text
我今天想要完成 4 点竞速赛。
```

The product should guide the child through a real engineering loop:

1. The AI tutor asks questions to understand the child's prior knowledge.
2. The child uses remote control to move the real robot to points A, B, C, and D.
3. The system records the four race points as the child confirms them.
4. The AI tutor uses questions, observations, and expert support to help the child understand what is happening.
5. Expert agents may be mentioned by the tutor and speak to the child when their domain is relevant.
6. The race design gradually becomes a child-confirmed plan.
7. The robot runs at least one timed lap.
8. The AI tutor guides the child to review the result and propose one improvement.

The experience should make the child feel:

- "I helped define the track."
- "The robot needs data to understand the real world."
- "Going faster is an engineering problem, not just a command."
- "Testing and improving is part of the game."

## AI Tutor Requirements

The AI tutor is the main agent. It behaves like a strong human teacher, not like a command parser.

The tutor must:

- Diagnose the child's prior knowledge through questions instead of assuming an age level.
- Ask one useful question at a time.
- Prefer judgment, prediction, reasoning, observation, and comparison questions.
- Adapt the depth of follow-up based on the child's answers.
- Introduce knowledge only when it naturally helps the child continue the task.
- Keep explicit knowledge injection small: at most one main concept per turn.
- Use the real robot's actions and feedback as learning evidence.
- Mention expert agents when a specialist voice would help the child think better.
- Translate expert input into child-appropriate next steps.
- Keep the child as the active decision maker.

The tutor must not:

- Directly generate the full solution before understanding the child's thinking.
- Ask trivial or low-value questions that do not advance learning.
- Turn the session into long lectures.
- Treat expert agents as a fixed parade of introductions.
- Expose internal model reasoning, raw prompts, or raw API/debug logs to the child.
- Let race performance override safety.

## Expert Agent Requirements

Expert agents are specialized teaching assistants. They can participate in the child-visible conversation, but they do not replace the AI tutor as the classroom lead.

Each expert agent needs its own skill definition covering:

- Personality and tone.
- Professional boundary.
- Tools or robot capabilities it understands.
- STEM concepts it can help reveal.
- Types of questions it tends to ask.
- Common child misconceptions it can diagnose.
- Child-facing response style.
- Structured notes it can provide to the tutor or planning system.

Expert agents should:

- Speak only when the tutor mentions or calls on them, or when their domain is directly relevant.
- Keep child-facing replies short, concrete, and connected to the current race step.
- Prefer observable evidence or small experiments over abstract explanation.
- Help the child understand a concept through the race task.
- Provide specialist knowledge without taking over the lesson.

Expert agents may produce two kinds of output:

- `public_reply`: child-facing text suitable for Console display.
- `expert_note`: structured specialist input for the tutor or system, not shown directly unless transformed into child-friendly content.

## MVP Expert Agents

### AI Tutor

The main teaching agent. It diagnoses understanding, asks Socratic questions, calls experts, controls pacing, and turns the race into a learning loop.

### Localization Engineer

Focus:

- Map points.
- Robot position.
- Coordinates.
- Heading.
- Localization uncertainty.

Learning opportunities:

- A physical place can be represented by numbers.
- A robot may estimate where it is.
- Position and heading are different pieces of information.
- Sensors and odometry can have error.

### Route Engineer

Focus:

- Turning four points into a route.
- Segment distance.
- Direction.
- Turn angle.

Learning opportunities:

- Points form line segments.
- Segments have length and direction.
- A route is a sequence of movement decisions.

### Motion Control Engineer

Focus:

- Speed.
- Turning.
- Acceleration and deceleration.
- Stability.
- Movement strategy.

Learning opportunities:

- Fast everywhere is not always fastest overall.
- Straight segments and turns may need different speeds.
- Inertia and control affect race performance.

### Radar Safety Engineer

Focus:

- Obstacles.
- Safe distance.
- Stopping conditions.
- Safety before performance.

Learning opportunities:

- Robots need sensors to react to the world.
- A safe system has stop rules.
- Race rules must respect physical surroundings.

### Timing Judge

Focus:

- Race start.
- Race finish.
- Lap time.
- Baseline result.

Learning opportunities:

- A race needs measurable start and end conditions.
- Baseline results make improvement visible.
- Timing turns a game into an experiment.

### Optimization Coach

Focus:

- Comparing attempts.
- Changing one variable at a time.
- Reviewing what improved or worsened.

Learning opportunities:

- Engineering improvement needs evidence.
- A fair comparison should not change everything at once.
- A failed attempt can still teach what to try next.

## Teaching Strategy

The default teaching loop is:

```text
Child goal
  -> Tutor diagnosis question
  -> Child answer
  -> Expert support when useful
  -> Observation or prediction
  -> Minimal concept naming
  -> Race plan update
  -> Robot experiment
  -> Review and next hypothesis
```

The tutor should use Socratic questioning to understand and extend the child's thinking:

- "你觉得第一步最重要的是什么？"
- "你为什么这么判断？"
- "我们怎么让小车自己知道这个点在哪里？"
- "你预测哪个数字会变化？"
- "如果只想跑快，把所有速度调到最大会怎样？"
- "这次我们只改一个变量，你想先改哪一个？"

Knowledge should emerge from the race:

- Setting A/B/C/D points leads to maps, coordinates, heading, and localization.
- Moving between points leads to distance, direction, and turn angle.
- Racing leads to speed, acceleration, inertia, and stability.
- Avoiding obstacles leads to sensing, thresholds, and safety rules.
- Improving a score leads to baseline, variables, comparison, and evidence.

The tutor should not force all concepts into one session. The session should follow the child's answers and the race progress.

## Child Console Experience

Console is the primary MVP surface.

Console should show:

- The child's messages.
- AI tutor replies.
- Expert agent replies when they are called into the lesson.
- Child-confirmed race design summaries.
- Child-readable robot action previews.
- Child-readable robot execution status.
- Race time and result summaries.
- Tutor-led review questions.

Console should not show:

- Raw model prompts.
- Internal chain-of-thought or hidden reasoning.
- Raw API debug logs.
- Long JSON blocks by default.
- Developer-only stack traces.

If technical artifacts are needed, they should be summarized for the child, for example:

```text
竞速计划草案：
- 赛道点：A、B、C、D
- 跑法：按 A -> B -> C -> D -> A
- 第一圈目标：先稳定完成，记录基准成绩
- 安全规则：发现太近的障碍物就停下
```

## Race Flow Requirements

The MVP race flow should support:

1. The child expresses the goal of a four-point race.
2. The tutor diagnoses what the child already understands.
3. The child uses remote control to place or move the robot to A, B, C, and D.
4. The tutor guides the child to observe that the robot records real-world points as data.
5. The tutor calls relevant expert agents during the process.
6. The child confirms a first race strategy.
7. The robot runs a safe baseline lap.
8. The system reports a race result in child-friendly language.
9. The tutor guides one improvement discussion.
10. The child chooses one change for the next attempt.

The MVP does not need polished frontend visualization. It does need a credible child-facing teaching conversation.

## Acceptance Criteria

The MVP is acceptable when:

- A child can start from "我今天想要完成 4 点竞速赛" in Console.
- The AI tutor asks diagnostic Socratic questions before giving instructions.
- The child can use remote control to participate in defining A/B/C/D.
- The tutor naturally introduces STEM ideas from the child's actions and robot feedback.
- At least three expert agents can be called into the conversation in a context-sensitive way.
- Expert replies reflect their personality, skill, and domain boundary.
- The Console remains child-facing and does not expose internal debug content.
- The session produces a child-confirmed race plan.
- The real robot can run at least one safe timed attempt.
- The tutor leads a post-run review that asks the child to reason about one improvement.

Success is measured by whether the child can explain part of the engineering idea behind the race, not only by whether the robot moves.

