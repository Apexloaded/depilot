import { firestore } from '../config/firebase.config.js';
import { seedEstates } from './data/estate.data.js';
import { seedPlots } from './data/plot.data.js';
import { seedProperties } from './data/property.data.js';
import { seedPropertyIdentifiers } from './data/property-identifier.data.js';
import { seedUsers } from './data/user.data.js';
import { seedDeal } from './data/deal.data.js';
import { seedPaymentPlan } from './data/payment-plan.data.js';

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
