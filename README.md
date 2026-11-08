# Cookie Lab — React + Spring Boot (Java)

Java-версия учебного проекта [cookie_example_react_springboot](https://github.com/tomatNasheDelo/cookie_example_react_springboot). Структура, идея и frontend сохранены; backend переведён с Kotlin на Java, Gradle Kotlin DSL (`build.gradle.kts`) оставлен.

- `frontend/` — React + TypeScript + Vite 7.
- `backend/` — Java + Spring Boot REST API, сборка через Gradle Kotlin DSL.
- API устанавливает `demoVisible` и `demoHttpOnly`; endpoint inspect показывает, какие cookies браузер отправил серверу.
- Подробная документация и команды запуска: [`start.txt`](start.txt).

> Учебная демонстрация: значения не являются секретами. Не возвращайте настоящие секретные cookies из API и не публикуйте секреты в `VITE_*`.
