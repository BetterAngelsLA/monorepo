<h1 align="center">
  <br>
  <a href="https://www.betterangels.la/" target="_blank" rel="noreferrer"><img alt="Better Angels Logo" src="https://avatars.githubusercontent.com/u/137959057?s=100&v=4" width="100"></a>
  <br>
  Better Angels Monorepo
  <br>
</h1>

<p align="center">
   <a href="https://reactnative.dev/docs/getting-started" target="_blank"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" hspace="10" /></a>
   <a href="https://storybook.js.org/docs" target="_blank"><img src="https://img.shields.io/badge/storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white" hspace="10" /></a>
   <a href="https://playwright.dev/docs/intro" target="_blank"><img src="https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=Playwright&logoColor=white" hspace="10" /></a>
   <a href="https://graphql.org/code/" target="_blank"><img src="https://img.shields.io/badge/GraphQl-E10098?style=for-the-badge&logo=graphql&logoColor=white" hspace="10" /></a>
   <br><br>
   <a href="https://docs.aws.amazon.com/" target="_blank"><img src="https://img.shields.io/badge/Amazon AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" hspace="10" /></a>
   <a href="https://docs.djangoproject.com/" target="_blank"><img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" hspace="10" /></a>
   <a href="https://docs.docker.com/" target="_blank"><img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" hspace="10" /></a>
   <a href="https://docs.expo.dev/" target="_blank"><img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=FFFFFF" hspace="10" /></a>
</p>

<br>
<br>

# BetterAngels Monorepo

Welcome to the BetterAngels Monorepo! This repository contains the codebases for both the frontend and backend components of the BetterAngels project. Our goal is to address homelessness through innovative technology solutions.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Frontend Development](#frontend-development)
3. [Backend Development](#backend-development)
4. [Seed Data](#seed-data)
5. [Development Workflow](#development-workflow)
6. [Shelter DB](#shelter-db)
7. [Licensing Details](#licensing-details)
8. [Contributing](#contributing)

## Project Overview

BetterAngels is a nonprofit organization focused on addressing the homelessness epidemic in Los Angeles. This monorepo contains the core applications that power our platform, including mobile apps, web apps, and backend services.

## Frontend Development

The frontend is built with [React Native](https://reactnative.dev/) and uses [Expo](https://docs.expo.dev/) for development across multiple platforms.

- **[Frontend Development Guide](docs/frontend_readme.md)**: This guide covers setting up the development environment, running the application, and testing.

## Backend Development

The backend is built with [Django](https://www.djangoproject.com/), a high-level Python web framework, and uses [Celery](https://docs.celeryproject.org/en/stable/) for distributed task processing.

- **[Backend Development Guide](docs/backend_readme.md)**: This guide covers setting up the development environment, running the backend server, and integrating Celery for task processing.

## Seed Data

### Users

The following users should exist as part of seed data:

- Agent - can access front-end account as an agent
  - username: agent
  - email: `agent@example.com`
  - password: password
- Client - can access front-end account as a client
  - username: client
  - email: `client@example.com`
  - password: password
- Django Admin - can access backend admin panel
  - username: admin
  - email: `admin@example.com`
  - password: password

## Development Workflow

To maintain a consistent and efficient development process, we have established a workflow that includes branch management, pull requests, and code reviews.

- **[Development Workflow Guide](docs/development_workflow.md)**: This document outlines our development practices, including how to create branches, submit pull requests, and conduct code reviews.

## Shelter DB

Shelter DB is a web project for discovering homeless shelters in LA County. More documentation for Shelter DB Project can be found [here](apps/shelter-web/README.md).

## Licensing Details

### Source Code

All of the source code to this product is released as [free](https://www.gnu.org/philosophy/free-sw.html) and [open source](https://www.opensource.org/docs/definition.php), licensed under the [GNU Affero General Public License (AGPL)](./LICENSE). This license ensures that our code remains free and open, encouraging others to contribute and share improvements while also ensuring that any modifications are made available to the community.

### Assets

For assets in this repository, you must also keep any license notices present in the source code and retain any attributions.

For additional information regarding licensing and attribution requirements and contribution guidelines, please refer to the README in the respective directory. See our [Attribution Guidlines](./docs/attribution_guidelines.md) for more information.

### Thank You

We are grateful to the open-source community for their invaluable contributions. By integrating these assets and leveraging other open-source resources (such as source code, libraries, frameworks, etc.), we not only enhance our application but also contribute to a broader ecosystem of shared resources and innovation. Thank you for supporting open source!

If you have any questions about licensing details or can provide information regarding any missing or incorrect licenses, please contact Better Angels United, Inc. at opensource-licensing@betterangels.la.

## Contributing

Are you a passionate technologist with a heart for service? Better Angels Tech Corps is calling on volunteers like you to help us craft a software platform that addresses every facet of homelessness. From outreach and shelter to client services and housing, we’re committed to creating holistic tech solutions that streamline processes and enhance user experiences for those most in need in our community.

We have immediate opportunities for volunteers in front-end and back-end development, infrastructure, and testing. Join us in the early stages of our volunteer program and make a difference.

Check out our [volunteer portal](https://volunteer.betterangels.la/need/detail/?need_id=866651) to sign up as a volunteer and get started!

---

Feel free to explore the individual guides linked above for more detailed instructions on setting up and contributing to the BetterAngels project. If you have any questions, please refer to the respective README files or reach out to our team.
