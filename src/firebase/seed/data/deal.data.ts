import {
  UserRole,
  dealStore,
  CreateDealInput,
  DealItemType,
  DealStage,
  DealType,
  User,
} from '../../collections/index.js';
import { userSeedData } from './user.data.js';

const getDealSeed = async () => {
  const buyers = userSeedData.filter((u) => u.role === UserRole.CLIENT);

  if (buyers.length < 3) {
    throw new Error('At least 3 buyers required');
  }

  const transformUserToBuyer = (buyer: User, isPrimary: boolean = false) => {
    return {
      id: buyer.id,
      isPrimary,
      name: `${buyer.firstName} ${buyer.lastName}`,
      phone: buyer.phoneNumber,
      email: buyer.email,
    };
  };

  const dealSeeds: CreateDealInput[] = [
    {
      deal: {
        stage: DealStage.INTAKE,
        title: 'Deal 1',
        dealType: DealType.SALE,
        primaryBuyer: transformUserToBuyer(buyers[0]!, true),
      },
      buyers: [buyers[0]!].map((u) => transformUserToBuyer(u, true)),
      items: [
        {
          itemType: DealItemType.PLOT,
          plotId: 'plot-greenview-a-001',
        },
      ],
    },
    {
      deal: {
        stage: DealStage.PAYMENT_PENDING,
        title: 'Deal 2',
        dealType: DealType.SALE,
        primaryBuyer: transformUserToBuyer(buyers[1]!, true),
      },
      buyers: buyers.map((u) => transformUserToBuyer(u, true)).slice(0, 2),
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
