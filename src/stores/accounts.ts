import { defineStore } from 'pinia'
import { ref } from 'vue'


export type LabelObj = { text: string }
export type RecordType = 'ldap' | 'local'


export type Account = {
id: string
labels: LabelObj[]
labelsRaw: string
type: RecordType
login: string
password: string | null
}


const STORAGE_KEY = 'accounts_v1'


export const useAccountsStore = defineStore('accounts', () => {
const accounts = ref<Account[]>([])


function load() {
try {
const raw = localStorage.getItem(STORAGE_KEY)
if (!raw) return
const parsed = JSON.parse(raw) as Account[]
accounts.value = parsed.map(a => ({ ...a }))
} catch (e) {
accounts.value = []
}
}


function persist() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.value))
}


function addEmpty() {
const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const acc: Account = {
id,
labels: [],
labelsRaw: '',
type: 'ldap',
login: '',
password: null,
}
accounts.value.push(acc)
persist()
return acc
}


function remove(id: string) {
const idx = accounts.value.findIndex(a => a.id === id)
if (idx >= 0) accounts.value.splice(idx, 1)
persist()
}


function update(account: Account) {
const idx = accounts.value.findIndex(a => a.id === account.id)
if (idx >= 0) accounts.value.splice(idx, 1, { ...account })
else accounts.value.push({ ...account })
persist()
}


load()


return { accounts, addEmpty, remove, update, load }
})