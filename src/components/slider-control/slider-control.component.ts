
import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';

@Component({
  selector: 'app-slider-control',
  template: `
    <div>
      <div class="flex justify-between items-center mb-1">
        <label [for]="label()" class="text-sm font-medium text-gray-700">{{ label() }}</label>
        <span class="text-sm font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
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

  onInputChange(value: string): void {
    this.valueChange.emit(parseFloat(value));
  }
}