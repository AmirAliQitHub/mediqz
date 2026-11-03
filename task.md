# Task Checklist: Bulletproof Authentication & Telegram Magic Login Engine (Module 8 - v3.4.0)

## Phase 1: Database Schema Expansion & Cryptographic Validation Backend
- [x] Substep 1.1: Database Migration, Index Sanitization & Identity Hardening (`backend/app/core/database.py`)
- [x] Substep 1.2: Cryptographic Telegram WebApp `initData` HMAC-SHA256 Validator & Real-Time Username Checker (`backend/app/api/auth.py`)

## Phase 2: Telegram Bot Magic Login Push & Approval Webhook
- [x] Substep 2.1: Magic Login Backend Request & Atomic Polling Endpoints (`backend/app/api/auth.py`)
- [x] Substep 2.2: Webhook Callback Query Approval Handler (`backend/app/bot/dispatcher.py`)

## Phase 3: 1-to-1 Account Linking & Mandatory Credentials Setup
- [x] Substep 3.1: Account Linking Endpoint, Brute-Force Shield & Idempotency (`backend/app/api/auth.py`)
- [x] Substep 3.2: Mobile Ergonomic Onboarding with Single Password Field & Live Checker (`frontend/src/components/auth/OnboardingModal.tsx` & `backend/app/api/auth.py`)

## Phase 4: Web Desktop Magic Login UI & Telegram Link Dialog in TWA
- [x] Substep 4.1: Desktop LoginPad Magic Telegram Login UI with Anti-Panic Circular Timer (`frontend/src/components/auth/LoginPad.tsx`)
- [x] Substep 4.2: TWA Dual Start Cards & Profile Telegram Status (`frontend/src/components/layout/UserProfileMenu.tsx` & `LoginPad.tsx`)
