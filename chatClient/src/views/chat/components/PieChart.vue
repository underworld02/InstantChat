<template>
  <div ref="chart" :style="{ width: width, height: height }"></div>
</template>

<script>
// 按需引入 ECharts 核心模块和所需组件
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册所需的组件
echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);


export default {
  name: 'PieChart',
  props: {
    data: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    width: {
      type: String,
      default: '100%',
    },
    height: {
      type: String,
      default: '400px',
    },
    colors: {
      type: Array,
      default: () => ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'],
    },
  },
  data() {
    return {
      chart: null,
    };
  },
  methods: {
    initChart() {
      if (this.chart) {
        this.chart.dispose();  // 确保重新初始化时清理旧图表实例
      }

      this.chart = echarts.init(this.$refs.chart);

      this.setChartOptions();
    },
    setChartOptions() {
      const option = {
        title: {
          text: this.title,
          left: 'center',
        },
        tooltip: {
          trigger: 'item',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
        },
        series: [
          {
            name: '数据来源',
            type: 'pie',
            radius: '50%',
            data: this.data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            itemStyle: {
              color: (params) => {
                return this.colors[params.dataIndex % this.colors.length];
              },
            },
          },
        ],
      };

      this.chart.setOption(option);
    },
    resizeChart() {
      if (this.chart) {
        this.chart.resize();
      }
    },
  },
  mounted() {
    this.initChart();
    window.addEventListener('resize', this.resizeChart);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart);
    if (this.chart) {
      this.chart.dispose();  // 清理图表实例
      this.chart = null;  // 防止内存泄漏
    }
  },
  watch: {
    data: {
      handler() {
        if (this.chart) {
          this.setChartOptions();
        }
      },
      deep: true,  // 深度观察数据变化
    },
    title: 'setChartOptions',  // 当标题变化时重新设置图表
    colors: 'setChartOptions', // 当颜色变化时重新设置图表
  },
};
</script>

<style scoped>
</style>