# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-ledger-filters.spec.ts >> C07/C09 synthetic demo keyboard, contrast, focus and preserved styling
- Location: e2e/session-ledger-filters.spec.ts:16:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'All 6', exact: true })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: 'All 6', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'All 6', exact: true })
    14 × locator resolved to <button type="button" aria-pressed="true" class="rounded px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7df1ff]">All 6</button>
       - unexpected value "inactive"

```

```yaml
- button "All 6" [pressed]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import fs from 'node:fs'
  3  | import path from 'node:path'
  4  | const fixture = JSON.parse(fs.readFileSync(new URL('../../postman/mocks/counsel-api/fixture.json', import.meta.url), 'utf8'))
  5  | const output = path.resolve('../docs/12/browser-evidence')
  6  | const url = '/demo/index.html#/session/11111111-1111-4111-8111-111111111111'
  7  | const labels = ['All','Contradictions','Unsupported']
  8  | const counts = [6,2,3]
  9  | const texts = fixture.ledger.facts.map(f=>f.fact_text)
  10 | async function styles(page: any) {
  11 |   return page.locator('aside').evaluate((aside: HTMLElement) => {
  12 |     const props = (el: Element, keys: string[]) => Object.fromEntries(keys.map(k=>[k,getComputedStyle(el).getPropertyValue(k)]))
  13 |     return { sidebar:props(aside,['width','background-color','border-left','color']), root:props(document.documentElement,['--cit-bg-1','--cit-portal','--cit-flare','--cit-alarm','--cit-text','--cit-text-dim','--cit-hairline']), cards:[...aside.querySelectorAll('.rounded-lg.p-3')].map(el=>props(el,['background-color','border','box-shadow','color'])) }
  14 |   })
  15 | }
  16 | test('C07/C09 synthetic demo keyboard, contrast, focus and preserved styling', async ({page})=>{
  17 |   fs.mkdirSync(output,{recursive:true})
  18 |   await page.goto(url)
  19 |   await expect(page.getByRole('note')).toContainText('LOCAL SYNTHETIC DEMO')
  20 |   await expect(page.locator('aside p.text-sm')).toHaveText(texts)
  21 |   const baselineFile=path.join(output,'baseline.json')
  22 |   if(process.env.CAPTURE_BASELINE==='1') {
  23 |     fs.writeFileSync(baselineFile,JSON.stringify(await styles(page),null,2));
  24 |     await page.screenshot({path:path.join(output,'baseline.png')}); return
  25 |   }
  26 |   expect(await styles(page)).toEqual(JSON.parse(fs.readFileSync(baselineFile,'utf8')))
  27 |   const buttons=labels.map((l,i)=>page.getByRole('button',{name:`${l} ${counts[i]}`,exact:true}))
  28 |   await test.step('C07 required accessible filter controls', async () => {
  29 |     for(const b of buttons)await expect(b).toBeVisible()
  30 |   })
  31 |   const measurements:any[]=[]
  32 |   async function measure(button:any,state:string) {
  33 |     const value=await button.evaluate((el:HTMLElement)=>{
  34 |       type RGB=number[]
  35 |       function color(s:string):RGB { return (s.match(/[\d.]+/g)??[]).map(Number) }
  36 |       function over(a:RGB,b:RGB):RGB {const alpha=a[3]??1;return [0,1,2].map(i=>a[i]*alpha+b[i]*(1-alpha)).concat(1)}
  37 |       function background(el:Element|null):RGB {if(!el)return [255,255,255,1];return over(color(getComputedStyle(el).backgroundColor),background(el.parentElement))}
  38 |       function lum(a:RGB) {const c=a.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
  39 |       function ratio(a:RGB,b:RGB){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  40 |       const s=getComputedStyle(el),bg=background(el),adjacent=background(el.parentElement)
  41 |       return {name:el.textContent,textContrast:ratio(over(color(s.color),bg),bg), countContrast:ratio(over(color(s.color),bg),bg),indicatorContrast:ratio(over(color(s.outlineColor),adjacent),adjacent),outlineStyle:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth),outlineColor:s.outlineColor,boxShadow:s.boxShadow,background:s.backgroundColor,color:s.color,border:s.border,focused:document.activeElement===el,selected:el.getAttribute('aria-pressed')}
  42 |     })
  43 |     measurements.push({state,...value,thresholds:{text:4.5,indicator:3,outlineWidth:2}})
  44 |     fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify(measurements,null,2))
  45 |     expect(value.textContrast).toBeGreaterThanOrEqual(4.5); expect(value.countContrast).toBeGreaterThanOrEqual(4.5)
  46 |     if(value.focused) {expect(value.outlineStyle).not.toBe('none');expect(value.outlineWidth).toBeGreaterThanOrEqual(2);expect(value.indicatorContrast).toBeGreaterThanOrEqual(3)}
  47 |     await page.screenshot({path:path.join(output,`${state}.png`)})
  48 |     return value
  49 |   }
  50 |   // Start at the focusable element immediately before the first filter.
  51 |   await buttons[0].evaluate((el:HTMLElement)=>{
  52 |     const all=[...document.querySelectorAll<HTMLElement>('button,a[href],input,textarea,select,[tabindex="0"]')].filter(e=>e.offsetParent!==null)
  53 |     all[all.indexOf(el)-1].focus()
  54 |   })
> 55 |   for(let i=0;i<3;i++) {await page.keyboard.press('Tab');await expect(buttons[i]).toBeFocused()}
     |                                                                                   ^ Error: expect(locator).toBeFocused() failed
  56 |   for(let i=0;i<3;i++) {
  57 |     await buttons[0].click();await page.locator('h2').filter({hasText:'FACT LEDGER'}).click()
  58 |     const unfocused=await measure(buttons[i],`${i}-unfocused`)
  59 |     await buttons[i].hover();await measure(buttons[i],`${i}-hovered`)
  60 |     await buttons[i].focus();const focused=await measure(buttons[i],`${i}-focused`)
  61 |     expect([focused.outlineStyle,focused.outlineWidth,focused.boxShadow]).not.toEqual([unfocused.outlineStyle,unfocused.outlineWidth,unfocused.boxShadow])
  62 |     for(const key of ['Enter','Space']) {
  63 |       const node=await buttons[i].elementHandle()
  64 |       await page.keyboard.press(key)
  65 |       await expect(buttons[i]).toBeFocused();await expect(buttons[i]).toHaveAttribute('aria-pressed','true')
  66 |       expect(await buttons[i].evaluate((el:Element,old:Element)=>el===old,node!)).toBe(true)
  67 |       expect(await page.locator('aside button[aria-pressed="true"]').count()).toBe(1)
  68 |       const expected=i===0?texts:i===1?[texts[1],texts[3]]:[texts[2],texts[3],texts[4]]
  69 |       await expect(page.locator('aside p.text-sm')).toHaveText(expected)
  70 |     }
  71 |     const selected=await measure(buttons[i],`${i}-selected-focused`)
  72 |     await page.locator('h2').filter({hasText:'FACT LEDGER'}).click();await measure(buttons[i],`${i}-selected`)
  73 |     if(i>0)expect(selected.background).not.toBe(unfocused.background)
  74 |   }
  75 |   await buttons[0].click();await expect(page.locator('aside p.text-sm')).toHaveText(texts)
  76 |   expect(await styles(page)).toEqual(JSON.parse(fs.readFileSync(baselineFile,'utf8')))
  77 |   // Only replace the ledger response; retain the labelled demo and all other requests.
  78 |   const zero=structuredClone(fixture.ledger)
  79 |   zero.facts.forEach(f=>{f.contradicts=[];f.citations=[fixture.ledger.facts[0].citations[0]]})
  80 |   await page.route('**/sessions/*/ledger',route=>route.fulfill({json:zero}))
  81 |   await page.reload()
  82 |   const empty=page.getByRole('button',{name:'Unsupported 0',exact:true})
  83 |   await expect(empty).toBeEnabled();await empty.focus();await page.keyboard.press('Space')
  84 |   await expect(page.getByText('No facts match this filter')).toBeVisible()
  85 |   await expect(empty).toBeFocused();await measure(empty,'zero-selected-focused')
  86 | })
  87 | 
```