export const PLANS = Object.freeze({basico:{name:'Básico',price:1500},profissional:{name:'Profissional',price:2500},premium:{name:'Premium',price:4000}});
export const PRICES = Object.freeze({camera:3000,badge:80,installation:5000,maintenance:500});
export const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function calculateQuote({plan,cameras,badges,installation,maintenance}) {
  if(!Object.hasOwn(PLANS,plan)) throw new Error('Selecione um plano válido.');
  for(const [name,value] of [['câmeras',cameras],['crachás',badges]]) {
    if(!Number.isInteger(value)||value<0||value>10000) throw new Error(`A quantidade de ${name} deve ser um número inteiro entre 0 e 10.000.`);
  }
  if(typeof installation!=='boolean'||typeof maintenance!=='boolean') throw new Error('Confira as opções de instalação e manutenção.');
  const cameraCost=cameras*PRICES.camera, badgeCost=badges*PRICES.badge, installationCost=installation?PRICES.installation:0, maintenanceCost=maintenance?PRICES.maintenance:0;
  return {plan,cameras,badges,installation,maintenance,cameraCost,badgeCost,installationCost,maintenanceCost,planCost:PLANS[plan].price,initial:cameraCost+badgeCost+installationCost,monthly:PLANS[plan].price+maintenanceCost};
}
export function quoteText(q) {
  return `YENA Healthcare Technology\nESTIMATIVA ACADÊMICA — sem validade de proposta comercial\n\nPlano ${PLANS[q.plan].name}\n\nCUSTOS INICIAIS (cobrança única)\n${q.cameras} câmera(s) × ${money(PRICES.camera)}: ${money(q.cameraCost)}\n${q.badges} crachá(s) × ${money(PRICES.badge)}: ${money(q.badgeCost)}\nInstalação ${q.installation?'incluída':'não incluída'}: ${money(q.installationCost)}\nTotal inicial: ${money(q.initial)}\n\nCUSTOS MENSAIS\nPlano ${PLANS[q.plan].name}: ${money(q.planCost)}\nManutenção ${q.maintenance?'incluída':'não incluída'}: ${money(q.maintenanceCost)}\nTotal mensal: ${money(q.monthly)}\n\nPrimeiro mês + custos iniciais: ${money(q.initial+q.monthly)}\n\nValores de referência para TCC. Não são preços comerciais definitivos.\nNenhum equipamento real ou serviço foi contratado.`;
}
export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function parseQuote(input) {
  const t=normalize(input);
  const plan=t.includes('profissional')?'profissional':t.includes('premium')?'premium':t.includes('basico')?'basico':null;
  if(!plan) return {error:'Informe o plano: Básico, Profissional ou Premium. Exemplo: “Orçamento Profissional, 4 câmeras, 20 crachás, com instalação e manutenção”.'};
  function quantity(noun) {
    const match=t.match(new RegExp('(\\d[\\d.,]*)\\s*(?:'+noun+')'));
    if(!match) {
      if(new RegExp('\\b(?:'+noun+')\\b').test(t)&&!new RegExp('sem\\s+(?:'+noun+')\\b').test(t)) throw new Error('Informe as quantidades em algarismos inteiros. Exemplo: 4 câmeras e 20 crachás.');
      return 0;
    }
    const raw=match[1];
    if(!/^\d+$/.test(raw)) throw new Error('Use quantidades inteiras sem separador. Exemplo: 20 câmeras.');
    return Number(raw);
  }
  function included(noun) {
    const negative=new RegExp('(?:sem|nao(?:\\s+incluir)?|excluir)\\s+(?:a\\s+)?'+noun+'|'+noun+'\\s*(?::|=)?\\s*(?:nao|excluida|excluido)');
    return t.includes(noun)&&!negative.test(t)&&!new RegExp('sem (?:instalacao e manutencao|manutencao e instalacao)').test(t);
  }
  try {
    if(/-\s*\d|\b(?:menos|negativ[oa])\s*\d/.test(t)) throw new Error('As quantidades não podem ser negativas.');
    if(/\d+\s*(?:mil|milhao)/.test(t)) throw new Error('Use as quantidades em algarismos completos, como 1000 câmeras.');
    const cameras=quantity('cameras?'),badges=quantity('crachas?');
    return {quote:calculateQuote({plan,cameras,badges,installation:included('instalacao'),maintenance:included('manutencao')})};
  } catch(e) {return {error:e.message};}
}
export const seedClients = () => [
  {id:'c1',name:'Marina Exemplo',institution:'Hospital Horizonte (fictício)',contact:'marina@exemplo.invalid',need:'Conhecer a proposta de acompanhamento de ambientes e solicitar uma estimativa.',stage:'Novo contato'},
  {id:'c2',name:'Rafael Exemplo',institution:'Clínica Aurora (fictícia)',contact:'rafael@exemplo.invalid',need:'Avaliar o plano Profissional com 4 câmeras e 20 crachás.',stage:'Em análise'},
  {id:'c3',name:'Clara Exemplo',institution:'Residencial Bem Viver (fictício)',contact:'clara@exemplo.invalid',need:'Preparar uma apresentação dos serviços para a instituição.',stage:'Orçamento enviado'}
];
export function validateClient(data) {
  if(!data||typeof data!=='object')throw new Error('Confira os dados do cliente.');
  for(const [field,label,max] of [['name','Nome',80],['institution','Instituição',120],['contact','Contato',120],['need','Necessidade',1000]]) {
    if(typeof data[field]!=='string'||!data[field].trim()) throw new Error(`Preencha o campo ${label.toLowerCase()}.`);
    if(data[field].trim().length>max) throw new Error(`${label}: limite de ${max} caracteres.`);
  }
  if(!['Novo contato','Em análise','Orçamento enviado'].includes(data.stage)) throw new Error('Selecione uma etapa válida.');
  return {...data,name:data.name.trim(),institution:data.institution.trim(),contact:data.contact.trim(),need:data.need.trim()};
}
