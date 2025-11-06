import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderControlComponent } from './components/slider-control/slider-control.component';
import { CactusViewerComponent } from './components/cactus-viewer/cactus-viewer.component';

export interface CactusConfig {
  body: {
    height: number;
    width: number;
    ribs: number;
    segmentation: number;
  };
  spines: {
    density: number;
    length: number;
  };
  addons: {
    flowers: number;
    flowerSize: number;
    flowerSizeVariation: number;
    potSize: number;
    seed: number;
  };
  arms: {
    count: number;
    position: number;
    length: number;
    thickness: number;
    placementSeed: number;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SliderControlComponent, CactusViewerComponent]
})
export class AppComponent {
  config = signal<CactusConfig>({
    body: {
      height: 80,
      width: 40,
      ribs: 8,
      segmentation: 20,
    },
    spines: {
      density: 50,
      length: 15,
    },
    addons: {
      flowers: 3,
      flowerSize: 25,
      flowerSizeVariation: 50,
      potSize: 60,
      seed: 1,
    },
    arms: {
      count: 0,
      position: 50,
      length: 50,
      thickness: 50,
      placementSeed: 1,
    }
  });

  updateBodyHeight(value: number): void {
    this.config.update(c => ({ ...c, body: { ...c.body, height: value } }));
  }
  updateBodyWidth(value: number): void {
    this.config.update(c => ({ ...c, body: { ...c.body, width: value } }));
  }
  updateBodyRibs(value: number): void {
    this.config.update(c => ({ ...c, body: { ...c.body, ribs: value } }));
  }
  updateBodySegmentation(value: number): void {
    this.config.update(c => ({ ...c, body: { ...c.body, segmentation: value } }));
  }

  updateSpinesDensity(value: number): void {
    this.config.update(c => ({ ...c, spines: { ...c.spines, density: value } }));
  }
  updateSpinesLength(value: number): void {
    this.config.update(c => ({ ...c, spines: { ...c.spines, length: value } }));
  }

  updateAddonsFlowers(value: number): void {
    this.config.update(c => ({ ...c, addons: { ...c.addons, flowers: value } }));
  }
  updateAddonsFlowerSize(value: number): void {
    this.config.update(c => ({ ...c, addons: { ...c.addons, flowerSize: value } }));
  }
  updateAddonsFlowerSizeVariation(value: number): void {
    this.config.update(c => ({ ...c, addons: { ...c.addons, flowerSizeVariation: value } }));
  }
  updateAddonsPotSize(value: number): void {
    this.config.update(c => ({ ...c, addons: { ...c.addons, potSize: value } }));
  }
  updateAddonsSeed(value: number): void {
    this.config.update(c => ({ ...c, addons: { ...c.addons, seed: value } }));
  }

  updateArmsCount(value: number): void {
    this.config.update(c => ({ ...c, arms: { ...c.arms, count: value } }));
  }
  updateArmsPosition(value: number): void {
    this.config.update(c => ({ ...c, arms: { ...c.arms, position: value } }));
  }
  updateArmsLength(value: number): void {
    this.config.update(c => ({ ...c, arms: { ...c.arms, length: value } }));
  }
  updateArmsThickness(value: number): void {
    this.config.update(c => ({ ...c, arms: { ...c.arms, thickness: value } }));
  }
  updateArmsPlacementSeed(value: number): void {
    this.config.update(c => ({ ...c, arms: { ...c.arms, placementSeed: value } }));
  }
}