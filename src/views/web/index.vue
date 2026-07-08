<template>
  <main class="auth-shell" aria-label="AI 在线教育平台身份认证">
    <section class="brand-panel" aria-label="平台能力展示">
      <div class="brand-panel__glow brand-panel__glow--cyan"></div>
      <div class="brand-panel__glow brand-panel__glow--indigo"></div>

      <div class="brand-copy">
        <div class="eyebrow">AI EDUCATION OS</div>
        <h1>让教学与学习，在同一个智能空间里高效发生</h1>
        <p>
          面向老师与学生的在线教育平台，整合课程、直播、数据洞察与学习进度，
          以可信赖的 AI 能力提升每一次线上教学体验。
        </p>
      </div>

      <div class="hero-card">
        <img :src="heroImage" alt="AI 教育平台的课程、直播和学习数据可视化" />
        <div class="metric-card metric-card--top">
          <span class="metric-card__label">AI Insight</span>
          <strong>92%</strong>
          <small>学习路径匹配度</small>
        </div>
        <div class="metric-card metric-card--bottom">
          <span class="metric-card__label">Live Class</span>
          <strong>18:30</strong>
          <small>高阶英语直播课</small>
        </div>
      </div>

      <div class="capability-strip" aria-label="核心能力">
        <div>
          <strong>课程发布</strong>
          <span>创建、直播、回放</span>
        </div>
        <div>
          <strong>学习进度</strong>
          <span>作业、路径、数据</span>
        </div>
        <div>
          <strong>智能互动</strong>
          <span>老师与学生协同</span>
        </div>
      </div>
    </section>

    <section class="form-panel">
      <div class="auth-card" aria-live="polite">
        <header class="auth-header">
          <a class="logo-lockup" href="#" aria-label="AI 在线教育平台首页">
            <span class="logo-mark" aria-hidden="true">AI</span>
            <span>
              <strong>EduPilot</strong>
              <small>随时学习 · 智慧教学</small>
            </span>
          </a>

          <div class="segmented-control role-switch" role="tablist" aria-label="选择身份">
            <button
              v-for="item in roles"
              :key="item.value"
              class="segment"
              :class="{ 'is-active': role === item.value }"
              type="button"
              role="tab"
              :aria-selected="role === item.value"
              @click="role = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </header>

        <div class="auth-title">
          <p class="eyebrow">{{ roleContent.eyebrow }}</p>
          <h2>{{ mode === 'register' ? roleContent.registerTitle : roleContent.loginTitle }}</h2>
          <p>{{ mode === 'register' ? roleContent.registerSubtitle : roleContent.loginSubtitle }}</p>
        </div>

        <div class="segmented-control mode-switch" role="tablist" aria-label="登录或注册">
          <button
            v-for="item in modes"
            :key="item.value"
            class="segment"
            :class="{ 'is-active': mode === item.value }"
            type="button"
            role="tab"
            :aria-selected="mode === item.value"
            @click="switchMode(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <div v-if="status.message" class="status-banner" :class="`is-${status.type}`" role="status">
          {{ status.message }}
        </div>

        <form v-show="mode === 'login'" class="auth-form is-active" novalidate @submit.prevent="submitLogin">
          <label class="field" :class="fieldClass('loginAccount')">
            <span>手机号 / 邮箱</span>
            <input
              v-model.trim="loginForm.account"
              type="text"
              autocomplete="username"
              placeholder="name@example.com"
              required
              @blur="validateField('loginAccount')"
              @input="clearField('loginAccount')"
            />
            <small class="field-message">{{ errors.loginAccount }}</small>
          </label>

          <label class="field field--password" :class="fieldClass('loginPassword')">
            <span>密码</span>
            <input
              v-model="loginForm.password"
              :type="showLoginPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入密码"
              required
              minlength="8"
              @blur="validateField('loginPassword')"
              @input="clearField('loginPassword')"
            />
            <button
              class="ghost-icon password-toggle"
              type="button"
              :aria-label="showLoginPassword ? '隐藏密码' : '显示密码'"
              @click="showLoginPassword = !showLoginPassword"
            >
              {{ showLoginPassword ? '隐藏' : '显示' }}
            </button>
            <small class="field-message">{{ errors.loginPassword }}</small>
          </label>

          <label v-if="captchaEnabled" class="field field--code" :class="fieldClass('loginCode')">
            <span>验证码</span>
            <input
              v-model.trim="loginForm.code"
              type="text"
              inputmode="numeric"
              placeholder="请输入验证码"
              required
              @blur="validateField('loginCode')"
              @input="clearField('loginCode')"
            />
            <button class="secondary-action captcha-action" type="button" @click="loadCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
              <span v-else>获取</span>
            </button>
            <small class="field-message">{{ errors.loginCode }}</small>
          </label>

          <div class="form-row">
            <label class="check">
              <input v-model="loginForm.remember" type="checkbox" />
              <span>记住登录</span>
            </label>
            <a href="#">忘记密码？</a>
          </div>

          <button class="primary-action" :class="{ 'is-loading': loading }" type="submit" :disabled="loading">
            <span class="button-label">{{ loading ? '处理中...' : '立即登录' }}</span>
            <span class="spinner" aria-hidden="true"></span>
          </button>

          <div class="divider"><span>第三方登录</span></div>
          <div class="social-grid">
            <button type="button" class="social-button" aria-label="使用 Google 登录">
              <span>G</span> Google
            </button>
            <button type="button" class="social-button" aria-label="使用 Apple 登录">
              <span>Apple</span>
            </button>
            <button type="button" class="social-button" aria-label="使用微信登录">
              <span>微</span> 微信
            </button>
          </div>
        </form>

        <form v-show="mode === 'register'" class="auth-form is-active" novalidate @submit.prevent="submitRegister">
          <div class="role-summary">
            当前注册身份：<strong>{{ roleLabel }}</strong>
          </div>

          <div class="field-grid">
            <label class="field" :class="fieldClass('name')">
              <span>姓名</span>
              <input
                v-model.trim="registerForm.name"
                type="text"
                autocomplete="name"
                placeholder="请输入真实姓名"
                required
                @blur="validateField('name')"
                @input="clearField('name')"
              />
              <small class="field-message">{{ errors.name }}</small>
            </label>

            <label class="field" :class="fieldClass('phone')">
              <span>手机号</span>
              <input
                v-model.trim="registerForm.phone"
                type="tel"
                autocomplete="tel"
                placeholder="138 0000 0000"
                required
                @blur="validateField('phone')"
                @input="clearField('phone')"
              />
              <small class="field-message">{{ errors.phone }}</small>
            </label>
          </div>

          <label class="field" :class="fieldClass('email')">
            <span>邮箱</span>
            <input
              v-model.trim="registerForm.email"
              type="email"
              autocomplete="email"
              placeholder="name@example.com"
              required
              @blur="validateField('email')"
              @input="clearField('email')"
            />
            <small class="field-message">{{ errors.email }}</small>
          </label>

          <label class="field field--password" :class="fieldClass('newPassword')">
            <span>密码</span>
            <input
              v-model="registerForm.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 8 位，包含字母与数字"
              required
              minlength="8"
              @blur="validateField('newPassword')"
              @input="clearField('newPassword')"
            />
            <button
              class="ghost-icon password-toggle"
              type="button"
              :aria-label="showNewPassword ? '隐藏密码' : '显示密码'"
              @click="showNewPassword = !showNewPassword"
            >
              {{ showNewPassword ? '隐藏' : '显示' }}
            </button>
            <small class="field-message">{{ errors.newPassword }}</small>
          </label>

          <div class="password-strength" :data-level="passwordLevel" aria-label="密码强度">
            <span></span>
            <span></span>
            <span></span>
            <small>{{ strengthText }}</small>
          </div>

          <div class="field-grid">
            <label class="field field--password" :class="fieldClass('confirmPassword')">
              <span>确认密码</span>
              <input
                v-model="registerForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="再次输入密码"
                required
                @blur="validateField('confirmPassword')"
                @input="clearField('confirmPassword')"
              />
              <button
                class="ghost-icon password-toggle"
                type="button"
                :aria-label="showConfirmPassword ? '隐藏密码' : '显示密码'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                {{ showConfirmPassword ? '隐藏' : '显示' }}
              </button>
              <small class="field-message">{{ errors.confirmPassword }}</small>
            </label>

            <label class="field field--code" :class="fieldClass('code')">
              <span>验证码</span>
              <input
                v-model.trim="registerForm.code"
                type="text"
                inputmode="numeric"
                placeholder="6 位验证码"
                required
                @blur="validateField('code')"
                @input="clearField('code')"
              />
              <button class="secondary-action captcha-action" type="button" @click="loadCaptcha">
                <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" />
                <span v-else>获取</span>
              </button>
              <small class="field-message">{{ errors.code }}</small>
            </label>
          </div>

          <label class="check check--policy">
            <input v-model="registerForm.policy" type="checkbox" required @change="validateField('policy')" />
            <span>我已阅读并同意<a href="#">《用户协议》</a>和<a href="#">《隐私政策》</a></span>
          </label>
          <small class="field-message policy-message">{{ errors.policy }}</small>

          <button class="primary-action" :class="{ 'is-loading': loading }" type="submit" :disabled="loading">
            <span class="button-label">{{ loading ? '处理中...' : '立即注册' }}</span>
            <span class="spinner" aria-hidden="true"></span>
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { appLogin, appRegister, getCodeImg } from '@/api/login'
import { setToken } from '@/utils/auth'
import heroImage from '@/assets/images/ai-education-auth-hero.png'

const roles = [
  { label: '老师', value: 'teacher' },
  { label: '学生', value: 'student' }
]

const modes = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' }
]

const content = {
  teacher: {
    eyebrow: 'Teacher Portal',
    loginTitle: '欢迎回来',
    loginSubtitle: '登录后继续管理课程、直播课堂与教学数据。',
    registerTitle: '创建教师账号',
    registerSubtitle: '开通课程发布、直播排课、学生管理与教学数据能力。'
  },
  student: {
    eyebrow: 'Student Portal',
    loginTitle: '继续学习',
    loginSubtitle: '登录后查看课程安排、加入直播课堂并同步学习进度。',
    registerTitle: '创建学生账号',
    registerSubtitle: '报名课程、观看回放、完成作业，并和老师保持互动。'
  }
}

const role = ref('teacher')
const mode = ref('login')
const loading = ref(false)
const showLoginPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const codeCountdown = ref(0)
const captchaEnabled = ref(true)
const captchaUrl = ref('')
const captchaUuid = ref('')
const status = reactive({ type: '', message: '' })
let codeTimer

const loginForm = reactive({
  account: '',
  password: '',
  code: '',
  remember: true
})

const registerForm = reactive({
  name: '',
  phone: '',
  email: '',
  newPassword: '',
  confirmPassword: '',
  code: '',
  policy: false
})

const errors = reactive({
  loginAccount: '',
  loginPassword: '',
  loginCode: '',
  name: '',
  phone: '',
  email: '',
  newPassword: '',
  confirmPassword: '',
  code: '',
  policy: ''
})

const touched = reactive({})

const roleContent = computed(() => content[role.value])
const roleLabel = computed(() => (role.value === 'teacher' ? '老师' : '学生'))

const passwordLevel = computed(() => {
  const value = registerForm.newPassword
  let level = 0
  if (value.length >= 8) level += 1
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) level += 1
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) level += 1
  return level
})

const strengthText = computed(() => {
  return ['密码强度：未填写', '密码强度：较弱', '密码强度：中等', '密码强度：安全'][passwordLevel.value]
})

function switchMode(nextMode) {
  mode.value = nextMode
  clearStatus()
  loginForm.code = ''
  registerForm.code = ''
  loadCaptcha()
}

function clearStatus() {
  status.type = ''
  status.message = ''
}

function showStatus(type, message) {
  status.type = type
  status.message = message
}

function clearField(field) {
  if (errors[field]) errors[field] = ''
}

function fieldClass(field) {
  return {
    'is-error': Boolean(errors[field]),
    'is-success': touched[field] && !errors[field]
  }
}

function valueOf(field) {
  const map = {
    loginAccount: loginForm.account,
    loginPassword: loginForm.password,
    loginCode: loginForm.code,
    name: registerForm.name,
    phone: registerForm.phone,
    email: registerForm.email,
    newPassword: registerForm.newPassword,
    confirmPassword: registerForm.confirmPassword,
    code: registerForm.code,
    policy: registerForm.policy
  }
  return map[field]
}

function validateField(field) {
  touched[field] = true
  const value = valueOf(field)
  let message = ''

  if ((typeof value === 'string' && !value.trim()) || value === false) {
    message = field === 'policy' ? '请先同意用户协议和隐私政策。' : '该字段为必填项。'
  } else if (field === 'loginAccount' && !/^(\S+@\S+\.\S+|1[3-9]\d{9})$/.test(value)) {
    message = '请输入有效的手机号或邮箱。'
  } else if (field === 'loginPassword' && value.length < 8) {
    message = '密码至少需要 8 位。'
  } else if (field === 'phone' && !/^1[3-9]\d{9}$/.test(value.replace(/\s/g, ''))) {
    message = '请输入有效手机号。'
  } else if (field === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
    message = '请输入有效邮箱。'
  } else if (field === 'newPassword' && value.length < 8) {
    message = '密码至少需要 8 位。'
  } else if (field === 'newPassword' && !(/[A-Za-z]/.test(value) && /\d/.test(value))) {
    message = '密码需同时包含字母与数字。'
  } else if (field === 'confirmPassword' && value !== registerForm.newPassword) {
    message = '两次输入的密码不一致。'
  } else if ((field === 'loginCode' || field === 'code') && captchaEnabled.value && !value) {
    message = '请输入验证码。'
  }

  errors[field] = message
  return !message
}

function validateFields(fields) {
  return fields.map(validateField).every(Boolean)
}

async function loadCaptcha() {
  try {
    const res = await getCodeImg()
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      captchaUrl.value = `data:image/gif;base64,${res.img}`
      captchaUuid.value = res.uuid
    } else {
      captchaUrl.value = ''
      captchaUuid.value = ''
    }
  } catch (error) {
    captchaUrl.value = ''
    showStatus('error', error?.message || '验证码加载失败，请稍后重试。')
  }
}

async function submitLogin() {
  const fields = captchaEnabled.value ? ['loginAccount', 'loginPassword', 'loginCode'] : ['loginAccount', 'loginPassword']
  if (!validateFields(fields)) {
    showStatus('error', '请检查表单中标记的内容后继续。')
    return
  }

  const roleName = role.value === 'teacher' ? '教师端' : '学生端'
  clearStatus()
  loading.value = true
  try {
    const res = await appLogin({
      username: loginForm.account,
      password: loginForm.password,
      code: loginForm.code,
      uuid: captchaUuid.value
    })
    setToken(res.token)
    showStatus('success', `${roleName}登录成功，正在进入工作台。`)
  } catch (error) {
    showStatus('error', error?.message || '登录失败，请稍后重试。')
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}

async function submitRegister() {
  const valid = validateFields(['name', 'phone', 'email', 'newPassword', 'confirmPassword', 'code', 'policy'])
  if (!valid) {
    showStatus('error', '请检查表单中标记的内容后继续。')
    return
  }

  const roleName = role.value === 'teacher' ? '教师' : '学生'
  clearStatus()
  loading.value = true
  try {
    const res = await appRegister({
      userType: role.value,
      username: registerForm.phone.replace(/\s/g, '') || registerForm.email,
      password: registerForm.newPassword,
      name: registerForm.name,
      phoneAreaCode: '+86',
      phone: registerForm.phone.replace(/\s/g, ''),
      email: registerForm.email,
      code: registerForm.code,
      uuid: captchaUuid.value
    })
    setToken(res.token)
    showStatus('success', `${roleName}账号创建成功，请继续完善资料。`)
  } catch (error) {
    showStatus('error', error?.message || '注册失败，请稍后重试。')
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}

function startCodeCountdown() {
  if (codeCountdown.value > 0) return

  codeCountdown.value = 30
  codeTimer = window.setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) {
      window.clearInterval(codeTimer)
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (codeTimer) window.clearInterval(codeTimer)
})

onMounted(loadCaptcha)
</script>

<style lang="scss" scoped>
:global(body) {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 12%, rgba(6, 182, 212, 0.16), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(79, 70, 229, 0.16), transparent 30%),
    linear-gradient(135deg, #ffffff 0%, #f4f8ff 48%, #eef5ff 100%);
}

.auth-shell {
  --color-bg: #f7fbff;
  --color-surface: rgba(255, 255, 255, 0.78);
  --color-surface-strong: #ffffff;
  --color-text: #0f172a;
  --color-muted: #64748b;
  --color-subtle: #94a3b8;
  --color-line: rgba(148, 163, 184, 0.26);
  --color-primary: #2563eb;
  --color-primary-strong: #1d4ed8;
  --color-indigo: #4f46e5;
  --color-cyan: #06b6d4;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --shadow-card: 0 24px 80px rgba(37, 99, 235, 0.14), 0 8px 24px rgba(15, 23, 42, 0.08);
  --shadow-soft: 0 16px 40px rgba(15, 23, 42, 0.08);
  --radius-xl: 24px;
  --radius-lg: 20px;
  --radius-md: 16px;
  --radius-sm: 12px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(432px, 0.82fr);
  gap: clamp(32px, 5vw, 72px);
  width: min(1440px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 56px);
  color: var(--color-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.auth-shell *,
.auth-shell *::before,
.auth-shell *::after {
  box-sizing: border-box;
}

.auth-shell button,
.auth-shell input {
  font: inherit;
}

.auth-shell button {
  cursor: pointer;
}

.auth-shell a {
  color: var(--color-primary);
  text-decoration: none;
}

.auth-shell a:hover {
  color: var(--color-primary-strong);
}

.brand-panel,
.form-panel {
  position: relative;
  min-width: 0;
}

.brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 32px;
  padding: clamp(28px, 5vw, 56px);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.58), rgba(238, 246, 255, 0.42));
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(24px);
}

.brand-panel__glow {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 999px;
  filter: blur(28px);
  opacity: 0.32;
  pointer-events: none;
}

.brand-panel__glow--cyan {
  top: -96px;
  left: -72px;
  background: var(--color-cyan);
}

.brand-panel__glow--indigo {
  right: -108px;
  bottom: 20%;
  background: var(--color-indigo);
}

.brand-copy {
  position: relative;
  z-index: 1;
  max-width: 640px;
}

.eyebrow {
  margin: 0 0 var(--space-3);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brand-copy h1 {
  margin: 0;
  font-size: clamp(36px, 5vw, 64px);
  line-height: 1.05;
  font-weight: 800;
}

.brand-copy p {
  max-width: 560px;
  margin: var(--space-5) 0 0;
  color: var(--color-muted);
  font-size: 17px;
  line-height: 1.8;
}

.hero-card {
  position: relative;
  z-index: 1;
  margin-top: clamp(32px, 5vw, 56px);
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 30px;
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: var(--shadow-soft);
}

.hero-card img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 22px;
}

.metric-card,
.capability-strip {
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.11);
  backdrop-filter: blur(18px);
}

.metric-card {
  position: absolute;
  display: grid;
  gap: var(--space-1);
  min-width: 148px;
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.metric-card--top {
  top: var(--space-8);
  right: calc(var(--space-8) * -1);
}

.metric-card--bottom {
  bottom: var(--space-8);
  left: calc(var(--space-6) * -1);
}

.metric-card__label,
.metric-card small,
.capability-strip span {
  color: var(--color-muted);
  font-size: 12px;
}

.metric-card strong {
  font-size: 26px;
}

.capability-strip {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-top: var(--space-6);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.capability-strip div {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
}

.capability-strip strong {
  font-size: 14px;
}

.form-panel {
  display: grid;
  align-items: center;
}

.auth-card {
  width: 100%;
  max-width: 512px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 28px;
  padding: clamp(24px, 4vw, 40px);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(28px);
}

.auth-header,
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.logo-lockup {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text);
}

.logo-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 15px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 900;
  background: linear-gradient(135deg, var(--color-primary), var(--color-indigo) 58%, var(--color-cyan));
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.26);
}

.logo-lockup strong,
.logo-lockup small {
  display: block;
}

.logo-lockup small {
  margin-top: 2px;
  color: var(--color-muted);
  font-size: 12px;
}

.segmented-control {
  display: inline-grid;
  grid-auto-flow: column;
  gap: var(--space-1);
  min-height: 40px;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  padding: var(--space-1);
  background: rgba(241, 245, 249, 0.74);
}

.mode-switch {
  width: 100%;
  grid-template-columns: 1fr 1fr;
  margin: var(--space-6) 0;
}

.segment {
  min-height: 32px;
  border: 0;
  border-radius: 999px;
  padding: 0 var(--space-4);
  color: var(--color-muted);
  background: transparent;
  transition: transform 250ms ease, background 250ms ease, color 250ms ease, box-shadow 250ms ease;
}

.segment:hover {
  color: var(--color-text);
}

.segment:focus-visible,
.primary-action:focus-visible,
.secondary-action:focus-visible,
.social-button:focus-visible,
.ghost-icon:focus-visible,
input:focus-visible,
.check input:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.24);
  outline-offset: 2px;
}

.segment.is-active {
  color: var(--color-text);
  background: var(--color-surface-strong);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.auth-title {
  margin-top: var(--space-8);
}

.auth-title h2 {
  margin: 0;
  font-size: 32px;
  line-height: 1.18;
}

.auth-title p:last-child {
  margin: var(--space-2) 0 0;
  color: var(--color-muted);
  line-height: 1.65;
}

.status-banner {
  margin-bottom: var(--space-4);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-size: 14px;
}

.status-banner.is-success {
  color: #047857;
  background: rgba(16, 185, 129, 0.12);
}

.status-banner.is-error {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
}

.auth-form {
  display: grid;
  gap: var(--space-4);
  animation: fadeSlide 250ms ease both;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.field {
  position: relative;
  display: grid;
  gap: var(--space-2);
}

.field span {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
}

.field input {
  width: 100%;
  min-height: 52px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: 0 var(--space-4);
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.88);
  transition: border-color 250ms ease, box-shadow 250ms ease, background 250ms ease;
}

.field--password input {
  padding-right: 64px;
}

.field--code input {
  padding-right: 116px;
}

.field input:hover {
  border-color: rgba(37, 99, 235, 0.34);
}

.field input:focus {
  border-color: rgba(37, 99, 235, 0.72);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  outline: 0;
}

.field.is-error input {
  border-color: rgba(239, 68, 68, 0.72);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
}

.field.is-success input {
  border-color: rgba(16, 185, 129, 0.58);
}

.field-message {
  min-height: 16px;
  color: var(--color-danger);
  font-size: 12px;
}

.ghost-icon,
.secondary-action {
  position: absolute;
  right: var(--space-2);
  bottom: 24px;
  min-width: 48px;
  min-height: 36px;
  border: 0;
  border-radius: 999px;
  color: var(--color-primary);
  background: rgba(37, 99, 235, 0.08);
}

.captcha-action {
  min-width: 92px;
  overflow: hidden;
}

.captcha-action img {
  display: block;
  width: 86px;
  height: 34px;
  object-fit: cover;
}

.ghost-icon:hover,
.secondary-action:hover {
  background: rgba(37, 99, 235, 0.13);
}

.form-row {
  color: var(--color-muted);
  font-size: 14px;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-muted);
  font-size: 14px;
}

.check input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.check--policy {
  align-items: flex-start;
  line-height: 1.6;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: var(--radius-md);
  color: #ffffff;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-indigo));
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.24);
  transition: transform 250ms ease, box-shadow 250ms ease, filter 250ms ease;
}

.primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 36px rgba(37, 99, 235, 0.3);
}

.primary-action:active {
  transform: translateY(0);
}

.primary-action:disabled {
  cursor: not-allowed;
  filter: grayscale(0.18);
  opacity: 0.72;
  transform: none;
}

.spinner {
  display: none;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.42);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

.primary-action.is-loading .spinner {
  display: inline-block;
}

.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-subtle);
  font-size: 13px;
}

.divider::before,
.divider::after {
  height: 1px;
  content: "";
  background: var(--color-line);
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.social-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.72);
  transition: transform 250ms ease, border-color 250ms ease, box-shadow 250ms ease;
}

.social-button span {
  font-weight: 900;
}

.social-button:hover {
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.role-summary {
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  color: var(--color-muted);
  background: rgba(37, 99, 235, 0.06);
  font-size: 14px;
}

.role-summary strong {
  color: var(--color-primary);
}

.password-strength {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  align-items: center;
}

.password-strength span {
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.24);
  transition: background 250ms ease;
}

.password-strength small {
  grid-column: 1 / -1;
  color: var(--color-muted);
  font-size: 12px;
}

.password-strength[data-level="1"] span:first-child {
  background: var(--color-danger);
}

.password-strength[data-level="2"] span:nth-child(-n + 2) {
  background: var(--color-warning);
}

.password-strength[data-level="3"] span {
  background: var(--color-success);
}

@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1120px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: auto;
  }

  .form-panel {
    align-items: start;
  }

  .auth-card {
    max-width: 640px;
  }
}

@media (max-width: 760px) {
  .auth-shell {
    padding: var(--space-4);
  }

  .brand-panel {
    display: none;
  }

  .auth-card {
    border-radius: var(--radius-xl);
    padding: var(--space-5);
  }

  .auth-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .role-switch {
    width: 100%;
    grid-template-columns: 1fr 1fr;
  }

  .field-grid,
  .social-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .auth-shell {
    padding: var(--space-3);
  }

  .auth-card {
    padding: var(--space-4);
  }

  .auth-title h2 {
    font-size: 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-shell *,
  .auth-shell *::before,
  .auth-shell *::after {
    animation-duration: 1ms !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
</style>
