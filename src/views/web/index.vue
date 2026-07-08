<template>
  <main class="web-auth">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">AI EDUCATION OS</p>
        <h1>EduPilot</h1>
        <p class="hero-text">
          App/H5 portal for teachers and students. Register here, then use the returned token for protected APIs.
        </p>
      </div>

      <img class="hero-image" :src="heroImage" alt="EduPilot learning dashboard" />

      <div class="hero-metrics">
        <div>
          <strong>Teacher</strong>
          <span>Courses, lessons, resources</span>
        </div>
        <div>
          <strong>Student</strong>
          <span>Classes, replay, progress</span>
        </div>
      </div>
    </section>

    <section class="auth-panel">
      <div class="brand-row">
        <span class="logo">AI</span>
        <div>
          <strong>EduPilot Web</strong>
          <small>Teacher / Student access</small>
        </div>
      </div>

      <div class="segmented" aria-label="Role">
        <button
          v-for="item in roles"
          :key="item.value"
          type="button"
          :class="{ active: form.userType === item.value }"
          @click="changeRole(item.value)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="segmented" aria-label="Mode">
        <button type="button" :class="{ active: mode === 'login' }" @click="changeMode('login')">Login</button>
        <button type="button" :class="{ active: mode === 'register' }" @click="changeMode('register')">Register</button>
      </div>

      <p v-if="message.text" class="message" :class="message.type">{{ message.text }}</p>

      <form class="auth-form" @submit.prevent="mode === 'login' ? submitLogin() : submitRegister()">
        <label>
          <span>Account</span>
          <input v-model.trim="form.username" autocomplete="username" placeholder="username / phone / email" />
        </label>

        <label>
          <span>Password</span>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="5-20 characters"
          />
          <button class="inline-button" type="button" @click="showPassword = !showPassword">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </label>

        <template v-if="mode === 'register'">
          <label>
            <span>Name</span>
            <input v-model.trim="form.name" autocomplete="name" placeholder="Real name" />
          </label>

          <div class="grid">
            <label>
              <span>Phone</span>
              <input v-model.trim="form.phone" autocomplete="tel" placeholder="13800000000" />
            </label>
            <label>
              <span>Email</span>
              <input v-model.trim="form.email" autocomplete="email" placeholder="name@example.com" />
            </label>
          </div>

          <label v-if="form.userType === 'student'">
            <span>Student No.</span>
            <input v-model.trim="form.studentNo" placeholder="Optional" />
          </label>
        </template>

        <label v-if="captchaEnabled" class="captcha-field">
          <span>Captcha</span>
          <input v-model.trim="form.code" placeholder="Code from image" />
          <button class="captcha-image" type="button" title="Refresh captcha" @click="loadCaptcha">
            <img v-if="captchaUrl" :src="captchaUrl" alt="Captcha" />
            <span v-else>Refresh</span>
          </button>
        </label>

        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? 'Submitting...' : mode === 'login' ? 'Login' : 'Create account' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { appLogin, appMe, appRegister, getCodeImg } from '@/api/login'
import { setToken } from '@/utils/auth'
import heroImage from '@/assets/images/ai-education-auth-hero.png'

const roles = [
  { label: 'Teacher', value: 'teacher' },
  { label: 'Student', value: 'student' }
]

const mode = ref('login')
const loading = ref(false)
const showPassword = ref(false)
const captchaEnabled = ref(true)
const captchaUrl = ref('')
const message = reactive({ type: '', text: '' })

const form = reactive({
  userType: 'teacher',
  username: '',
  password: '',
  name: '',
  phoneAreaCode: '+86',
  phone: '',
  email: '',
  studentNo: '',
  code: '',
  uuid: ''
})

function changeMode(nextMode) {
  mode.value = nextMode
  clearMessage()
  form.code = ''
  loadCaptcha()
}

function changeRole(nextRole) {
  form.userType = nextRole
  clearMessage()
}

function clearMessage() {
  message.type = ''
  message.text = ''
}

function showMessage(type, text) {
  message.type = type
  message.text = text
}

function validateBase() {
  if (!form.username) return 'Account is required'
  if (!form.password) return 'Password is required'
  if (form.password.length < 5 || form.password.length > 20) return 'Password must be 5-20 characters'
  if (captchaEnabled.value && !form.code) return 'Captcha is required'
  return ''
}

function validateRegister() {
  const baseError = validateBase()
  if (baseError) return baseError
  if (!form.name) return 'Name is required'
  if (!form.phone && !form.email) return 'Phone or email is required'
  return ''
}

function appPayload() {
  return {
    userType: form.userType,
    username: form.username,
    password: form.password,
    name: form.name,
    phoneAreaCode: form.phoneAreaCode,
    phone: form.phone,
    email: form.email,
    studentNo: form.studentNo,
    code: form.code,
    uuid: form.uuid
  }
}

async function loadCaptcha() {
  try {
    const res = await getCodeImg()
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      captchaUrl.value = `data:image/gif;base64,${res.img}`
      form.uuid = res.uuid
    } else {
      captchaUrl.value = ''
      form.uuid = ''
    }
  } catch (error) {
    captchaUrl.value = ''
    showMessage('error', 'Failed to load captcha')
  }
}

async function submitLogin() {
  const error = validateBase()
  if (error) {
    showMessage('error', error)
    return
  }

  loading.value = true
  clearMessage()
  try {
    const res = await appLogin({
      username: form.username,
      password: form.password,
      code: form.code,
      uuid: form.uuid
    })
    setToken(res.token)
    const profile = await appMe()
    showMessage('success', `Logged in as ${profile.userType}, profileId=${profile.profileId}`)
  } catch (error) {
    showMessage('error', error?.message || 'Login failed')
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}

async function submitRegister() {
  const error = validateRegister()
  if (error) {
    showMessage('error', error)
    return
  }

  loading.value = true
  clearMessage()
  try {
    const res = await appRegister(appPayload())
    setToken(res.token)
    const profile = await appMe()
    showMessage('success', `Registered ${profile.userType}, profileId=${profile.profileId}`)
  } catch (error) {
    showMessage('error', error?.message || 'Registration failed')
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(loadCaptcha)
</script>

<style lang="scss" scoped>
.web-auth {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 460px;
  gap: 48px;
  padding: 48px;
  color: #0f172a;
  background:
    radial-gradient(circle at 12% 12%, rgba(6, 182, 212, 0.16), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(79, 70, 229, 0.16), transparent 30%),
    linear-gradient(135deg, #ffffff 0%, #f4f8ff 48%, #eef5ff 100%);
}

.hero,
.auth-panel {
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 24px 80px rgba(37, 99, 235, 0.14), 0 8px 24px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(24px);
}

.hero {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 28px;
  padding: clamp(28px, 5vw, 56px);
}

.eyebrow {
  margin: 0 0 12px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(48px, 7vw, 84px);
  line-height: 1;
}

.hero-text {
  max-width: 620px;
  margin: 18px 0 0;
  color: #64748b;
  font-size: 18px;
  line-height: 1.7;
}

.hero-image {
  width: 100%;
  max-height: 460px;
  object-fit: cover;
  border-radius: 22px;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.hero-metrics div {
  display: grid;
  gap: 6px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.hero-metrics span,
.brand-row small {
  color: #64748b;
}

.auth-panel {
  align-self: center;
  display: grid;
  gap: 18px;
  padding: 32px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-row strong,
.brand-row small {
  display: block;
}

.logo {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #2563eb, #4f46e5 58%, #06b6d4);
}

.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  min-height: 42px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  padding: 4px;
  background: rgba(241, 245, 249, 0.74);
}

.segmented button {
  border: 0;
  border-radius: 999px;
  color: #64748b;
  background: transparent;
}

.segmented button.active {
  color: #0f172a;
  background: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.message {
  margin: 0;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
}

.message.success {
  color: #047857;
  background: rgba(16, 185, 129, 0.12);
}

.message.error {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
}

.auth-form {
  display: grid;
  gap: 14px;
}

label {
  position: relative;
  display: grid;
  gap: 8px;
  font-weight: 700;
}

input {
  width: 100%;
  min-height: 50px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  padding: 0 14px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.9);
}

input:focus {
  border-color: rgba(37, 99, 235, 0.72);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  outline: 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.inline-button,
.captcha-image {
  position: absolute;
  right: 8px;
  bottom: 7px;
  min-height: 36px;
  border: 0;
  border-radius: 999px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.inline-button {
  min-width: 58px;
}

.captcha-field input {
  padding-right: 132px;
}

.captcha-image {
  width: 118px;
  overflow: hidden;
}

.captcha-image img {
  display: block;
  width: 100%;
  height: 36px;
  object-fit: cover;
}

.primary {
  min-height: 52px;
  border: 0;
  border-radius: 14px;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.24);
}

.primary:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

button {
  cursor: pointer;
}

@media (max-width: 1060px) {
  .web-auth {
    grid-template-columns: 1fr;
  }

  .auth-panel {
    width: min(100%, 620px);
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .web-auth {
    padding: 16px;
  }

  .hero {
    display: none;
  }

  .auth-panel {
    padding: 22px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
