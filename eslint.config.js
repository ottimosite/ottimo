import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
const browserGlobals={window:'readonly',document:'readonly',localStorage:'readonly',URL:'readonly',setTimeout:'readonly',console:'readonly',navigator:'readonly',location:'readonly'}
const workerGlobals={self:'readonly',caches:'readonly',fetch:'readonly'}
const testGlobals={describe:'readonly',it:'readonly',expect:'readonly',beforeEach:'readonly',afterEach:'readonly',vi:'readonly'}
export default defineConfig([
  { ignores:['dist','node_modules','.netlify'] }, js.configs.recommended,
  { files:['src/**/*.{ts,tsx}'], languageOptions:{parser:tsParser,globals:{...browserGlobals}}, plugins:{'@typescript-eslint':tsPlugin,'react-hooks':reactHooks,'react-refresh':reactRefresh}, rules:{...reactHooks.configs['recommended-latest'].rules,'react-refresh/only-export-components':['warn',{allowConstantExport:true}],'no-unused-vars':'off','no-undef':'off'} },
  { files:['scripts/**/*.mjs'], languageOptions:{globals:{process:'readonly',Buffer:'readonly',console:'readonly',setTimeout:'readonly'}} },
  { files:['public/sw.js'], languageOptions:{globals:workerGlobals} },
  { files:['src/tests/**/*.{ts,tsx}'], languageOptions:{globals:{...browserGlobals,...testGlobals}} }
])
