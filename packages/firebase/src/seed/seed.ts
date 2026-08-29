import { firestore } from '../config/firebase.config';
import { seedEstates } from './data/estate.data';
import { seedPlots } from './data/plot.data';
import { seedProperties } from './data/property.data';
import { seedPropertyIdentifiers } from './data/property-identifier.data';
import { seedUsers } from './data/user.data';
import { seedDeal } from './data/deal.data';
import { seedPaymentPlan } from './data/payment-plan.data';

async function main() {
  await seedUsers();
  await seedEstates();
  await seedPaymentPlan();
  await seedProperties();
  await seedPlots();
  await seedPropertyIdentifiers();
  await seedDeal();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await firestore.terminate();
  });
