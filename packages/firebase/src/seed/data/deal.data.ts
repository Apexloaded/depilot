import {
  UserRole,
  dealStore,
  CreateDealInput,
  DealItemType,
  DealStatus,
  DealType,
} from '../../collections';
import { userSeedData } from './user.data';

const getDealSeed = async () => {
  const buyers = userSeedData.filter((u) => u.role === UserRole.CLIENT);

  if (buyers.length < 3) {
    throw new Error('At least 3 buyers required');
  }

  const dealSeeds: CreateDealInput[] = [
    {
      deal: {
        status: DealStatus.ENQUIRY,
        title: 'Deal 1',
        dealType: DealType.SALE,
        buyerIds: buyers.map((u) => u.id).slice(0, 2),
        primaryBuyer: {
          userId: buyers[0]!.id,
          isPrimary: true,
          displayName: `${buyers[0]!.firstName} ${buyers[0]!.lastName}`,
        },
      },
      items: [
        {
          itemType: DealItemType.PLOT,
          plotId: 'plot-greenview-a-001',
        },
      ],
    },
    {
      deal: {
        status: DealStatus.OFFER_ISSUED,
        title: 'Deal 1',
        dealType: DealType.SALE,
        buyerIds: [buyers[2]!.id],
        primaryBuyer: {
          userId: buyers[2]!.id,
          isPrimary: true,
          displayName: `${buyers[2]!.firstName} ${buyers[2]!.lastName}`,
        },
      },
      items: [
        {
          itemType: DealItemType.PLOT,
          plotId: 'plot-hillcrest-a-001',
        },
      ],
    },
  ];

  return dealSeeds;
};

export async function seedDeal() {
  const deals = await getDealSeed();

  const promises = deals.map((deal) => dealStore.create(deal));
  await Promise.all(promises);
  console.log(`Seeded ${deals.length} deal(s).`);
}
