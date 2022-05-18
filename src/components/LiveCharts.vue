<template>
    <div class="mt-2">
        Status: {{ liveStream.broadcasting_status }}
    </div>
    <section class="w-100">
      <div style="height: 250px" class="my-5">
        <div class="text-grey3">Delay</div>
        <div class="text-secondary">{{ currDelay }} ms</div>
        <LineChart :chartData="delayData" height="240" :options="chartOptions" ref="delayChart"/>
      </div>
      <div style="height: 250px" class="my-5">
        <div class="text-grey3">Video bitrate</div>
        <div class="text-secondary">{{ currVidBitrate }} Kbps</div>
        <LineChart :chartData="videoBitRateData" height="240" :options="chartOptions" ref="vidBitrateChart"/>
      </div>
      <div style="height: 250px" class="my-5">
        <div class="text-grey3">Audio bitrate</div>
        <div class="text-secondary">{{ currAudioBitrate }}  Kbps</div>
        <LineChart :chartData="audioBitRateData" height="240" :options="chartOptions" ref="audioBitrateChart"/>
      </div>
      <div style="height: 250px" class="my-5">
        <div class="text-grey3">Frame Rate</div>
        <div class="text-secondary">{{ currFps }} fps</div>
        <LineChart :chartData="frameRateData" height="240" :options="chartOptions" ref="fpsChart"/>
      </div>
    </section>
</template>

<script>
import { LineChart } from 'vue-chart-3'
import { Chart, registerables } from "chart.js";
import 'chartjs-adapter-dayjs-3';
import dayjs from 'dayjs';
import StreamStatsService from '../services/StreamStatsService';
import _ from 'lodash'
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(...registerables);
Chart.register(zoomPlugin);

export default {
  name: 'LiveCharts',
  components: { LineChart },
  props: {
      streamKey: {
          type: String
      }
  },
  async created() {
    await this.initializeCharts();
  },
  beforeDestroy () {
    if(this.statsSubId) clearInterval(this.statsSubId);
  },
  data() {
    return {
      liveStream: {
          broadcasting_status: 'offline',
      },
      isLoading: true,
      xScale: [],
      currDelay: 0,
      currVidBitrate: 0,
      currAudioBitrate: 0,
      currFps: 0,
      lastTime: 0,
      historicalData: [],
      historicalLowData: [],
      currentSessionId: null,
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId;
    },
    broadCastingStatus() {
      return this.liveStream?.broadcasting_status || 'offline'
    },
    createdTime() {
      const date1 = dayjs(this.liveStream?.creation_time || 0)
      const time1 = dayjs(this.liveStream?.creation_time || 0)
      return date1.format('MMM D YYYY') + ', at ' + time1.format('h:mm A')
    },
    chartOptions() {
      return {
        plugins: { 
          legend: { 
            display: false
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'x',
            }
          }
        },
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          xAxes: {
            type: 'time',
            distribution: 'series',
            min: Date.now() - 60 * 1000,
            time: {
              unit: 'minute',
              stepSize: this.stepSize,
            },
          },
          yAxis: {
            position: 'right', // `axis` is determined by the position as `'y'`
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }
    },
    delayData() {
      let data = [];
      this.historicalData.forEach((d) => {
        data.push({ x: d.time_ms, y: d.ts_delay })
      });
      return {
        labels: this.xScale,
        datasets: [
          {
            fill: true,
            data,
            backgroundColor: ['#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF'],
            borderColor: 'rgba(45, 104, 255, 1)',
            borderWidth: 2,
            pointRadius: 0.3,
            backgroundColor: "rgba(45, 104, 255, 0.01)",
          },
        ],
      }
    },
    videoBitRateData() {
      let data = [];
      this.historicalData.forEach((d) => {
        data.push({ x: d.time_ms, y: d.video_bitrate })
      });
      return {
        labels: this.xScale,
        datasets: [
          {
            fill: true,
            data,
            backgroundColor: ['#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF'],
            borderColor: 'rgba(45, 104, 255, 1)',
            borderWidth: 2,
            pointRadius: 0.3,
            backgroundColor: "rgba(45, 104, 255, 0.01)",
          },
        ],
      }
    },
    audioBitRateData() {
      let data = [];
      this.historicalData.forEach((d) => {
        data.push({ x: d.time_ms, y: d.audio_bitrate })
      });
      return {
        labels: this.xScale,
        datasets: [
          {
            fill: true,
            data,
            backgroundColor: ['#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF'],
            borderColor: 'rgba(45, 104, 255, 1)',
            borderWidth: 2,
            pointRadius: 0.3,
            backgroundColor: "rgba(45, 104, 255, 0.01)",
          },
        ],
      }
    },
    frameRateData() {
      let data = [];
      this.historicalData.forEach((d) => {
        data.push({ x: d.time_ms, y: d.fps })
      });
      return {
        labels: this.xScale,
        datasets: [
          {
            fill: true,
            data,
            backgroundColor: ['#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF', '#2D68FF'],
            borderColor: 'rgba(45, 104, 255, 1)',
            borderWidth: 2,
            pointRadius: 0.3,
            backgroundColor: "rgba(45, 104, 255, 0.01)",
          },
        ],
      }
    },
  },
  methods: {
    async initializeCharts(showLoader = true) {
      if(showLoader) this.isLoading = true;
      if(this.streamKey) {
        // load historical data
        const sessionsList = await StreamStatsService.getSessionsList(this.streamKey);
        const liveSession = sessionsList.find(session => session.live);

        if(liveSession) {
          this.currentSessionId = liveSession.id;
          this.historicalData = await StreamStatsService.getSessionData(liveSession.id);
          if(this.historicalData.length) {
            const lastDataPoint = this.historicalData[this.historicalData.length - 1];
            this.lastTime = lastDataPoint.time_ms;
            this.currDelay = lastDataPoint.ts_delay || 0;
            this.currVidBitrate= lastDataPoint.video_bitrate || 0;
            this.currAudioBitrate= lastDataPoint.audio_bitrate || 0;
            this.currFps = lastDataPoint.fps || 0;
          }
        }
      }

      this.subscribeToStats();

      this.xScale = [];
      if(showLoader) this.isLoading = false;
    },
    subscribeToStats() {
      // this.fetchStatsData();
      if(this.statsSubId) clearInterval(this.statsSubId);
      this.statsSubId = setInterval(() => {
        this.fetchStatsData();
      }, 2000)
    },
    async fetchStatsData() {
      if(!this.streamKey) return;
      try {

        if(!this.currentSessionId) {
          const pulseObject = await StreamStatsService.getStreamMediaPulse(
            this.streamKey,
            true
          );

          
          if('success' in pulseObject && !pulseObject.success) {
            this.liveStream.broadcasting_status = 'offline';
            return;
          }
          
          if(this.liveStream.broadcasting_status === 'offline') {
            // stream has started
            this.liveStream.broadcasting_status = 'online';
            return this.initializeCharts(false);
          }
        }
        let newData = null;

        try {
          newData = await StreamStatsService.getSessionData(this.currentSessionId, 10);
        } catch {
          this.liveStream.broadcasting_status = 'offline';
          return;
        }
        const lastTime = newData[0].time_ms
        if(Date.now() > lastTime + 2000) {
            this.liveStream.broadcasting_status = 'offline';
            return;
        }
        this.liveStream.broadcasting_status = 'online';
        newData = newData.reverse();
        // return console.log(newData)
        
        this.currDelay = this.updateChart(this.$refs.delayChart, newData, 'ts_delay');
        this.updateChart(this.$refs.vidBitrateChart, newData, 'video_bitrate');
        this.updateChart(this.$refs.audioBitrateChart, newData, 'audio_bitrate');
        this.updateChart(this.$refs.fpsChart, newData, 'fps');
      } catch (e) {
        console.log(e);
      }
    },
    updateChart(chartRef, data, key) {
      if(!chartRef) return;
      if(!chartRef?.chartData) {
          console.log(this.$refs);
      }
      const len = chartRef.chartData.datasets[0].data.length - 1;
      const lastDataPoint = chartRef.chartData.datasets[0].data[len];
      const lastPointTime = lastDataPoint?.x;

      let newDataArray = data.map(d => ({ x: d.time_ms, y: d[key] })) || [];
      if(lastPointTime) {
        newDataArray = newDataArray.filter(d => d.x > lastPointTime);
      }
      if(!newDataArray.length) return (lastDataPoint?.y || 0);
      chartRef.chartData.datasets[0].data.push(...newDataArray);

      chartRef.chartInstance.update();
      return newDataArray[newDataArray.length - 1]?.y || lastDataPoint?.y || 0 ;
    },
  },
  watch: {
      streamKey() {
          this.initializeCharts();
          console.log('loading');
      }
  },
};
</script>

<style>
.test {
  height: 300px;
}
.text-online {
  color: #61C075;
}
</style>
