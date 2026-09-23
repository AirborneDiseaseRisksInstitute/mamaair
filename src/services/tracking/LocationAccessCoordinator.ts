import { DEV_LOCAL_SESSION } from '../../config/dev';
import { ProfileService } from '../api/ProfileService';
import {
  locationTracker,
  type LocationPermissionStatus,
} from './LocationTracker';

export interface LocationAccessState {
  permissionStatus: LocationPermissionStatus;
  trackingEnabled: boolean;
  trackingActive: boolean;
}

class LocationAccessCoordinator {
  private enableRequest: Promise<LocationPermissionStatus> | null = null;
  private backendSync: Promise<void> = Promise.resolve();
  private lastQueuedBackendValue: boolean | null = null;

  public isTracking(): boolean {
    return locationTracker.isTracking();
  }

  public addTrackingStateListener(listener: (active: boolean) => void) {
    return locationTracker.addTrackingStateListener(listener);
  }

  public isTrackingEnabled(): boolean {
    return locationTracker.isTrackingEnabled();
  }

  public getPermissionStatus(): Promise<LocationPermissionStatus> {
    return locationTracker.getPermissionStatus();
  }

  public async getState(): Promise<LocationAccessState> {
    const permissionStatus = await locationTracker.getPermissionStatus();
    return {
      permissionStatus,
      trackingEnabled:
        permissionStatus === 'granted' && locationTracker.isTrackingEnabled(),
      trackingActive:
        permissionStatus === 'granted' && locationTracker.isTracking(),
    };
  }

  public async getTrackingStatus(): Promise<LocationPermissionStatus> {
    const state = await this.getState();
    if (state.trackingActive && state.permissionStatus === 'granted') {
      return 'granted';
    }
    return state.permissionStatus === 'blocked' ? 'blocked' : 'denied';
  }

  public async enable(): Promise<LocationPermissionStatus> {
    if (this.enableRequest) return this.enableRequest;

    this.enableRequest = locationTracker
      .requestAndStart()
      .then(status => {
        this.syncBackend(status === 'granted' && locationTracker.isTracking());
        return status;
      })
      .catch(error => {
        this.syncBackend(false);
        throw error;
      })
      .finally(() => {
        this.enableRequest = null;
      });
    return this.enableRequest;
  }

  public disable(): void {
    locationTracker.stopTracking();
    this.syncBackend(false);
  }

  public decline(): void {
    this.disable();
  }

  public async resume(): Promise<LocationPermissionStatus> {
    const status = await locationTracker.resumeIfEnabled();
    this.syncBackend(status === 'granted' && locationTracker.isTracking());
    return status;
  }

  public resetForSignedOutSession(): void {
    locationTracker.reset();
    this.lastQueuedBackendValue = null;
  }

  private syncBackend(enabled: boolean): void {
    if (DEV_LOCAL_SESSION || this.lastQueuedBackendValue === enabled) return;
    this.lastQueuedBackendValue = enabled;

    this.backendSync = this.backendSync
      .catch(() => {})
      .then(() => ProfileService.patchProfile({ tracking_enabled: enabled }))
      .then(() => undefined)
      .catch(error => {
        if (this.lastQueuedBackendValue === enabled) {
          this.lastQueuedBackendValue = null;
        }
        console.warn(
          '[LocationAccess] Failed to sync tracking preference',
          error,
        );
      });
  }
}

export const locationAccessCoordinator = new LocationAccessCoordinator();
