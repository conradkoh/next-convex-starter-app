---
trigger: always_on
description: 
globs: 
---
<title>Important rules to follow when planning tasks or when working on tasks</title>
<overview>
[progress.html](mdc:progress.html) contains many important detailed guidelines and tasks that should use to plan for tasks. There are a few key parts that help with ensuring a cohesive system design when multiple people work on different tasks.
1. Changelog - this helps us understand the context of previous changes to the features we are implementing
2. Project Structure - this helps us understand how and where we should write the files in an idiomatic fashion.
3. Implementation Details (file names, function names, interfaces) - these kinds of planning in advance help us not be overwhelmed with details, while ensuring that we can make the different large scale features work well with one another.
</overview>
<directive>
    <core>Always use [progress.html](mdc:progress.html) to plan the tasks.</core>
</directive>

<warnings>
    <level:danger>DO NOT RUN the `pnpm run dev` command</level:danger>
</warnings>

<verify>
    <check>Did you write your tasks inside [progress.html](mdc:progress.html)</check>
    <check>Did you mark your current active task as "in-progress" in [progress.html](mdc:progress.html)?</check>
    <check>Did you update [progress.html](mdc:progress.html) after you completed a task?</check>
</verify>