# Web tools

Web utility tools privacy focused

## Overview

A client-side web application for managing PDF files directly in the browser.

## Features

- Drag and drop PDF file upload
- Client-side PDF merging
- No backend required
- Privacy-focused (no file uploads to external servers)

## Prerequisites

- Node.js (v18+)
- Docker (optional)
- Make (optional)

## Local Development Setup

### 1. Install Dependencies

```bash
make install
```

### 2. Start Development Server

```bash
make start
```

## Building the Application

### Production Build

```bash
make build
```

## Docker Deployment

### Build Docker Image

```bash
make docker-build
```

### Run Docker Image

```bash
make docker-run
```

### Very project initialization

```bash
make docker-create-app
```