import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
const fixture = JSON.parse(fs.readFileSync(new URL('../../postman/mocks/counsel-api/fixture.json', import.meta.url), 'utf8'))
const output = path.resolve('../docs/12/browser-evidence')
const url = '/demo/index.html#/session/11111111-1111-4111-8111-111111111111'
const labels = ['All','Contradictions','Unsupported']
const counts = [6,2,3]
const texts = fixture.ledger.facts.map(f=>f.fact_text)
async function styles(page: any) {
  return page.locator('aside').evaluate((aside: HTMLElement) => {
    const props = (el: Element, keys: string[]) => Object.fromEntries(keys.map(k=>[k,getComputedStyle(el).getPropertyValue(k)]))
    return { sidebar:props(aside,['width','background-color','border-left','color']), root:props(document.documentElement,['--cit-bg-1','--cit-portal','--cit-flare','--cit-alarm','--cit-text','--cit-text-dim','--cit-hairline']), cards:[...aside.querySelectorAll('.rounded-lg.p-3')].map(el=>props(el,['background-color','border','box-shadow','color'])) }
  })
}
test('C07/C09 synthetic demo keyboard, contrast, focus and preserved styling', async ({page})=>{
  fs.mkdirSync(output,{recursive:true})
  await page.goto(url)
  await expect(page.getByRole('note')).toContainText('LOCAL SYNTHETIC DEMO')
  await expect(page.locator('aside p.text-sm')).toHaveText(texts)
  const baselineFile=path.join(output,'baseline.json')
  if(process.env.CAPTURE_BASELINE==='1') {
    fs.writeFileSync(baselineFile,JSON.stringify(await styles(page),null,2));
    await page.screenshot({path:path.join(output,'baseline.png')}); return
  }
  expect(await styles(page)).toEqual(JSON.parse(fs.readFileSync(baselineFile,'utf8')))
  const buttons=labels.map((l,i)=>page.getByRole('button',{name:`${l} ${counts[i]}`,exact:true}))
  for(const b of buttons)await expect(b).toBeVisible()
  const measurements:any[]=[]
  async function measure(button:any,state:string) {
    const value=await button.evaluate((el:HTMLElement)=>{
      type RGB=number[]
      function color(s:string):RGB { return (s.match(/[\d.]+/g)??[]).map(Number) }
      function over(a:RGB,b:RGB):RGB {const alpha=a[3]??1;return [0,1,2].map(i=>a[i]*alpha+b[i]*(1-alpha)).concat(1)}
      function background(el:Element|null):RGB {if(!el)return [255,255,255,1];return over(color(getComputedStyle(el).backgroundColor),background(el.parentElement))}
      function lum(a:RGB) {const c=a.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
      function ratio(a:RGB,b:RGB){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
      const s=getComputedStyle(el),bg=background(el),adjacent=background(el.parentElement)
      return {name:el.textContent,textContrast:ratio(over(color(s.color),bg),bg), countContrast:ratio(over(color(s.color),bg),bg),indicatorContrast:ratio(over(color(s.outlineColor),adjacent),adjacent),outlineStyle:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth),outlineColor:s.outlineColor,boxShadow:s.boxShadow,background:s.backgroundColor,color:s.color,border:s.border,focused:document.activeElement===el,selected:el.getAttribute('aria-pressed')}
    })
    measurements.push({state,...value,thresholds:{text:4.5,indicator:3,outlineWidth:2}})
    fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify(measurements,null,2))
    expect(value.textContrast).toBeGreaterThanOrEqual(4.5); expect(value.countContrast).toBeGreaterThanOrEqual(4.5)
    if(value.focused) {expect(value.outlineStyle).not.toBe('none');expect(value.outlineWidth).toBeGreaterThanOrEqual(2);expect(value.indicatorContrast).toBeGreaterThanOrEqual(3)}
    await page.screenshot({path:path.join(output,`${state}.png`)})
    return value
  }
  // Start at the focusable element immediately before the first filter.
  await buttons[0].evaluate((el:HTMLElement)=>{
    const all=[...document.querySelectorAll<HTMLElement>('button,a[href],input,textarea,select,[tabindex="0"]')].filter(e=>e.offsetParent!==null)
    all[all.indexOf(el)-1].focus()
  })
  for(let i=0;i<3;i++) {await page.keyboard.press('Tab');await expect(buttons[i]).toBeFocused()}
  for(let i=0;i<3;i++) {
    await buttons[0].click();await page.locator('h2').filter({hasText:'FACT LEDGER'}).click()
    const unfocused=await measure(buttons[i],`${i}-unfocused`)
    await buttons[i].hover();await measure(buttons[i],`${i}-hovered`)
    await buttons[i].focus();const focused=await measure(buttons[i],`${i}-focused`)
    expect([focused.outlineStyle,focused.outlineWidth,focused.boxShadow]).not.toEqual([unfocused.outlineStyle,unfocused.outlineWidth,unfocused.boxShadow])
    for(const key of ['Enter','Space']) {
      const node=await buttons[i].elementHandle()
      await page.keyboard.press(key)
      await expect(buttons[i]).toBeFocused();await expect(buttons[i]).toHaveAttribute('aria-pressed','true')
      expect(await buttons[i].evaluate((el:Element,old:Element)=>el===old,node!)).toBe(true)
      expect(await page.locator('aside button[aria-pressed="true"]').count()).toBe(1)
      const expected=i===0?texts:i===1?[texts[1],texts[3]]:[texts[2],texts[3],texts[4]]
      await expect(page.locator('aside p.text-sm')).toHaveText(expected)
    }
    const selected=await measure(buttons[i],`${i}-selected-focused`)
    await page.locator('h2').filter({hasText:'FACT LEDGER'}).click();await measure(buttons[i],`${i}-selected`)
    if(i>0)expect(selected.background).not.toBe(unfocused.background)
  }
  await buttons[0].click();await expect(page.locator('aside p.text-sm')).toHaveText(texts)
  expect(await styles(page)).toEqual(JSON.parse(fs.readFileSync(baselineFile,'utf8')))
  // Only replace the ledger response; retain the labelled demo and all other requests.
  const zero=structuredClone(fixture.ledger)
  zero.facts.forEach(f=>{f.contradicts=[];f.citations=[fixture.ledger.facts[0].citations[0]]})
  await page.route('**/sessions/*/ledger',route=>route.fulfill({json:zero}))
  await page.reload()
  const empty=page.getByRole('button',{name:'Unsupported 0',exact:true})
  await expect(empty).toBeEnabled();await empty.focus();await page.keyboard.press('Space')
  await expect(page.getByText('No facts match this filter')).toBeVisible()
  await expect(empty).toBeFocused();await measure(empty,'zero-selected-focused')
})
