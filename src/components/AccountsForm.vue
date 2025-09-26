<template>
	<div class="wrapper">
		<div class="header">
			<h2>Учётные записи</h2>
			<button class="add-btn" @click="add">+</button>
		</div>

		<div class="hint">Для указания нескольких меток для одной записи используйте разделитель ;</div>

		<table class="table">
			<thead>
				<tr>
					<th>Метка</th>
					<th>Тип записи</th>
					<th>Логин</th>
					<th>Пароль</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(acc, idx) in accounts" :key="acc.id">
					<td>
						<input
							v-model="acc.labelsRaw"
							@blur="onBlur(acc, 'labels')"
							:class="{
								invalid: errors[acc.id] && errors[acc.id].labels,
								success: success[acc.id] && success[acc.id].labels
							}"
							maxlength="50"
							placeholder="метки;через;точку"
						/>
					</td>

					<td>
						<select v-model="acc.type" @change="onTypeChange(acc)">
							<option value="ldap">LDAP</option>
							<option value="local">Локальная</option>
						</select>
					</td>

					<td :colspan="acc.type === 'ldap' ? 2 : 1">
						<input
							class="login-input"
							v-model="acc.login"
							@blur="onBlur(acc, 'login')"
							:class="{
								invalid: errors[acc.id] && errors[acc.id].login,
								success: success[acc.id] && success[acc.id].login
							}"
							maxlength="100"
							placeholder="Логин"
						/>
					</td>

					<td v-if="acc.type === 'local'">
						<div class="password-wrapper">
							<input
								class="password-input"
								:type="acc.showPassword ? 'text' : 'password'"
								v-model="acc.passwordTemp"
								@blur="onBlur(acc, 'password', $event)"
								:class="{
									invalid: errors[acc.id] && errors[acc.id].password,
									success: success[acc.id] && success[acc.id].password
								}"
								maxlength="100"
							/>
							<button type="button" class="toggle-eye" @click="acc.showPassword = !acc.showPassword">
								<span v-if="acc.showPassword" style="text-decoration: line-through;">👁</span>
								<span v-else>👁</span>
							</button>
						</div>
					</td>

					<td>
						<button class="trash" @click="remove(acc.id)">🗑</button>
					</td>
				</tr>
				
				<tr v-if="accounts.length === 0">
					<td colspan="5" class="empty">Нет записей</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup lang="ts">
import { reactive, toRaw } from 'vue'
import { useAccountsStore } from '../stores/accounts'

const store = useAccountsStore()
const accounts = store.accounts

type FieldErrors = { labels?: boolean; login?: boolean; password?: boolean }
const errors: Record<string, FieldErrors> = reactive({})
const success: Record<string, { labels?: boolean; login?: boolean; password?: boolean }> = reactive({})

function normalizeLabels(raw: string) {
  return raw
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map(t => ({ text: t }))
}

function validate(acc: any) {
  const e: FieldErrors = {}
  if (acc.labelsRaw && acc.labelsRaw.length > 50) e.labels = true
  if (!acc.login || acc.login.trim() === '' || acc.login.length > 100) e.login = true
  if (acc.type === 'local') {
    const pass = acc.passwordTemp ?? ''
    if (!pass || pass.trim() === '' || pass.length > 100) e.password = true
  }
  errors[acc.id] = e
  return Object.keys(e).length === 0
}

function commit(acc: any) {
  const valid = validate(acc)
  if (!valid) return

  acc.labels = normalizeLabels(acc.labelsRaw || '')

  if (acc.type === 'ldap') {
    acc.password = null
    delete acc.passwordTemp
  } else {
    if (acc.passwordTemp !== undefined) {
      acc.password = acc.passwordTemp
    }
  }

  store.update(toRaw(acc))
  markSuccess(acc)
}

//Everything related to this function is necessary to highlight the code in green when a new value is successfully written
function markSuccess(acc: any) {
  success[acc.id] = success[acc.id] || {}
  success[acc.id].labels = false
  success[acc.id].login = false
  success[acc.id].password = false

  if (!errors[acc.id]?.labels) {
    success[acc.id].labels = true
    setTimeout(() => (success[acc.id].labels = false), 1000)
  }
  if (!errors[acc.id]?.login) {
    success[acc.id].login = true
    setTimeout(() => (success[acc.id].login = false), 1000)
  }
  if (acc.type === 'local' && !errors[acc.id]?.password) {
    success[acc.id].password = true
    setTimeout(() => (success[acc.id].password = false), 1000)
  }
}

function onBlur(acc: any, field: 'labels' | 'login' | 'password', event?: FocusEvent) {
  if (field === 'password' && event) {
    const related = event.relatedTarget as HTMLElement
    if (related && related.classList.contains('toggle-eye')) return
  }
  commit(acc)
}

function onTypeChange(acc: any) {
  if (acc.type === 'ldap') acc.passwordTemp = null
  commit(acc)
}

function add() {
  const newAcc = store.addEmpty()
  ;(newAcc as any).passwordTemp = null
  ;(newAcc as any).showPassword = false
}

function remove(id: string) {
  store.remove(id)
  delete errors[id]
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Account[]
    accounts.value = parsed.map(a => ({
      ...a,
      labelsRaw: a.labels.map(l => l.text).join(';'),
      passwordTemp: a.password,
      showPassword: false
    }))
  } catch (e) {
    accounts.value = []
  }
}
</script>

<style scoped>
.wrapper {
  max-width: 980px;
  margin: 12px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-btn {
  padding: 6px 10px;
  font-size: 18px;
}

.hint {
  margin: 8px 0;
  color: #999;
  font-size: 0.9rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.table th,
.table td {
  padding: 8px;
  text-align: left;
  border: none;
  vertical-align: middle;
}

.empty {
  text-align: center;
  color: #777;
  padding: 20px;
}

.invalid {
  border: 1px solid #c00;
}

.success {
  border: 1px solid #0a0;
  transition: border-color 0.3s ease;
}

.trash {
  background: none;
  border: none;
  cursor: pointer;
}

.muted {
  color: #777;
}

.login-input,
.password-input,
.table td input,
.table td select {
  width: 100%;
  box-sizing: border-box;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  flex: 1;
  padding-right: 30px;
}

.password-wrapper .password-input {
  padding-right: 34px;
}

.toggle-eye {
  position: absolute;
  right: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  outline: none;
  padding: 0;
  margin: 0;
}
</style>