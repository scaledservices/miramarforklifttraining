export function walletCardState(input: {loading?:boolean;error?:boolean;existingOrder?:{status:string}|null;entitlements?:{status:string}[]}): 'loading'|'unavailable'|'ordered'|'upload'|'purchase' {
 if(input.loading) return 'loading';
 if(input.error) return 'unavailable';
 if(input.existingOrder && !['canceled','refunded'].includes(input.existingOrder.status)) return 'ordered';
 if(input.entitlements?.some(e=>e.status==='fulfilled')) return 'ordered';
 if(input.entitlements?.some(e=>e.status==='awaiting_photo')) return 'upload';
 return 'purchase';
}
