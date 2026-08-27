import { firestore } from '@repo/firebase';

class AppState {
  private collection = firestore.collection('app_state');

  async createProcess() {}
}
