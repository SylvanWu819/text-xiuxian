/**
 * TimeManager - 时间管理器
 * 负责游戏时间的推进、季节更新和时间触发事件检测
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { PlayerState, Season, TimeCost } from '../types';

/**
 * 时间事件配置
 */
export interface TimeEvent {
  id: string;
  name: string;
  description: string;
  triggerCondition: (state: PlayerState) => boolean;
}

export class TimeManager {
  private state: PlayerState;
  private timeEvents: TimeEvent[] = [];

  constructor(state: PlayerState) {
    this.state = state;
    this.initializeTimeEvents();
  }

  /**
   * 初始化时间触发事件
   * Validates: Requirements 3.5, 3.6
   */
  private initializeTimeEvents(): void {
    // 每年春季：宗门大比
    this.registerTimeEvent({
      id: 'sect_competition',
      name: '宗门大比',
      description: '一年一度的宗门大比即将开始',
      triggerCondition: (state) => {
        return state.time.season === Season.Spring && 
               state.time.month === 1 &&
               state.faction.current !== null;
      }
    });

    // 每5年：秘境开启
    this.registerTimeEvent({
      id: 'secret_realm_opens',
      name: '秘境开启',
      description: '传说中的秘境再次开启',
      triggerCondition: (state) => {
        return state.time.year % 5 === 0 && 
               state.time.month === 1;
      }
    });

    // 每10年：天地异象
    this.registerTimeEvent({
      id: 'celestial_phenomenon',
      name: '天地异象',
      description: '天空出现异象，灵气波动剧烈',
      triggerCondition: (state) => {
        return state.time.year % 10 === 0 && 
               state.time.month === 6;
      }
    });
  }

  /**
   * 注册时间事件
   */
  registerTimeEvent(event: TimeEvent): void {
    this.timeEvents.push(event);
  }

  /**
   * 推进时间
   * Validates: Requirements 3.1, 3.2, 3.4
   */
  advance(timeCost: TimeCost): void {
    // 推进天数
    if (timeCost.days) {
      this.advanceDays(timeCost.days);
    }

    // 推进月份
    if (timeCost.months) {
      this.advanceMonths(timeCost.months);
    }

    // 推进年份
    if (timeCost.years) {
      this.advanceYears(timeCost.years);
    }
  }

  /**
   * 推进天数
   * Validates: Requirements 3.1, 3.2
   */
  private advanceDays(days: number): void {
    // 简化处理：30天为一个月
    const months = Math.floor(days / 30);
    if (months > 0) {
      this.advanceMonths(months);
    }
  }

  /**
   * 推进月份
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  private advanceMonths(months: number): void {
    this.state.time.month += months;

    // 处理年份进位
    while (this.state.time.month > 12) {
      this.state.time.month -= 12;
      this.state.time.year += 1;
    }

    // 更新季节
    this.updateSeason();
  }

  /**
   * 推进年份
   * Validates: Requirements 3.1, 3.2
   */
  private advanceYears(years: number): void {
    this.state.time.year += years;
  }

  /**
   * 更新季节
   * Validates: Requirements 3.3
   */
  private updateSeason(): void {
    const month = this.state.time.month;
    
    if (month >= 1 && month <= 3) {
      this.state.time.season = Season.Spring;
    } else if (month >= 4 && month <= 6) {
      this.state.time.season = Season.Summer;
    } else if (month >= 7 && month <= 9) {
      this.state.time.season = Season.Autumn;
    } else {
      this.state.time.season = Season.Winter;
    }
  }

  /**
   * 检查并触发时间事件
   * Validates: Requirements 3.5, 3.6
   */
  checkTimeEvents(): TimeEvent[] {
    const triggeredEvents: TimeEvent[] = [];

    for (const event of this.timeEvents) {
      if (event.triggerCondition(this.state)) {
        triggeredEvents.push(event);
      }
    }

    return triggeredEvents;
  }

  /**
   * 获取当前时间
   * Validates: Requirements 3.3
   */
  getCurrentTime(): { year: number; season: Season; month: number } {
    return {
      year: this.state.time.year,
      season: this.state.time.season,
      month: this.state.time.month
    };
  }

  /**
   * 格式化时间显示
   * Validates: Requirements 3.3
   */
  formatTime(): string {
    const seasons = ['春季', '夏季', '秋季', '冬季'];
    return `第${this.state.time.year}年 ${seasons[this.state.time.season]}`;
  }

  /**
   * 获取季节名称
   */
  getSeasonName(season?: Season): string {
    const s = season !== undefined ? season : this.state.time.season;
    const seasons = ['春季', '夏季', '秋季', '冬季'];
    return seasons[s];
  }

  /**
   * 计算两个时间点之间的月份差
   */
  calculateMonthsDifference(
    time1: { year: number; month: number },
    time2: { year: number; month: number }
  ): number {
    return (time2.year - time1.year) * 12 + (time2.month - time1.month);
  }

  /**
   * 检查是否到达特定时间节点
   */
  isTimePoint(year: number, month: number): boolean {
    return this.state.time.year === year && this.state.time.month === month;
  }

  /**
   * 检查是否在特定季节
   */
  isInSeason(season: Season): boolean {
    return this.state.time.season === season;
  }

  /**
   * 获取当前年份
   */
  getCurrentYear(): number {
    return this.state.time.year;
  }

  /**
   * 获取当前月份
   */
  getCurrentMonth(): number {
    return this.state.time.month;
  }

  /**
   * 获取当前季节
   */
  getCurrentSeason(): Season {
    return this.state.time.season;
  }

  /**
   * 设置时间（用于测试或特殊情况）
   */
  setTime(year: number, month: number): void {
    this.state.time.year = year;
    this.state.time.month = month;
    this.updateSeason();
  }

  /**
   * 获取所有注册的时间事件
   */
  getTimeEvents(): TimeEvent[] {
    return [...this.timeEvents];
  }

  /**
   * 清除所有时间事件
   */
  clearTimeEvents(): void {
    this.timeEvents = [];
  }
}
