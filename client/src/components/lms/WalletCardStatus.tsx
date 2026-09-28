import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { walletCardState } from '@shared/wallet-card-state';

export default function WalletCardStatus({ certificationId }: {certificationId:number}) {
 const { t } = useTranslation();
 const ent = useQuery<{entitlements:{id:number;status:string}[]}>({queryKey:[`/api/photo-id/entitlements?certificationId=${certificationId}`],enabled:certificationId>0});
 const cert = useQuery<{existingCardOrder:{status:string}|null}>({queryKey:['/api/certifications',certificationId],enabled:certificationId>0});
 const state = walletCardState({loading:ent.isLoading||cert.isLoading,error:!!(ent.error||cert.error),existingOrder:cert.data?.existingCardOrder,entitlements:ent.data?.entitlements});
 const prepaid = ent.data?.entitlements.find(e=>e.status==='awaiting_photo');
 return <section className="rounded-lg border p-4 space-y-3 text-left" data-testid={`wallet-card-${state}`}>
  <h3 className="font-semibold">{t('certSuccess.walletCardPrepaidTitle')}</h3>
  {state==='loading' && <p>{t('common.loading')}</p>}
  {state==='unavailable' && <p>{t('walletCard.statusUnavailable')}</p>}
  {state==='ordered' && <p>{t('certSuccess.walletCardFulfilledDesc')}</p>}
  {state==='upload' && prepaid && <>
   <p>{t('certSuccess.walletCardPrepaidDesc')}</p>
   <Link href={`/order-cert-card/${certificationId}?entitlement=${prepaid.id}`}><Button data-testid="button-upload-prepaid-photo">{t('certSuccess.uploadPhotoCta')}</Button></Link>
  </>}
  {state==='purchase' && <>
   <p>{t('walletCard.optionalPhoto')}</p>
   <Link href={`/order-cert-card/${certificationId}`}><Button variant="outline" data-testid="button-purchase-photo-id">{t('walletCard.addPhoto')}</Button></Link>
  </>}
 </section>;
}
