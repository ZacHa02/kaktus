
import { ChangeDetectionStrategy, Component, output, input, computed } from '@angular/core';

@Component({
  selector: 'app-slider-control',
  template: `
    <div>
      <div class="flex justify-between items-center mb-1.5">
        <label [for]="label()" class="text-sm font-medium text-stone-700">{{ label() }}</label>
        <span class="text-sm font-medium text-stone-600">
          {{ value() }}{{ unit() ? ' ' + unit() : '' }}
        </span>
      </div>
      <input
        #slider
        type="range"
        [id]="label()"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="value()"
        [style.--value-percent]="valuePercent() + '%'"
        (input)="onInputChange(slider.value)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderControlComponent {
  label = input.required<string>();
  min = input<number>(0);
  max = input<number>(100);
  step = input<number>(1);
  value = input.required<number>();
  unit = input<string>('');

  valueChange = output<number>();

  valuePercent = computed(() => {
    const range = this.max() - this.min();
    if (range === 0) return 0;
    return ((this.value() - this.min()) / range) * 100;
  });

  onInputChange(value: string): void {
    this.valueChange.emit(parseFloat(value));
  }
}
