const LCD_WIDTH                         = 32;
const LCD_HEIGHT                        = 16;

const ICON_NUM                          = 8;

const btn_state_t = {
    BTN_STATE_RELEASED: 0,
	BTN_STATE_PRESSED: 1
};

const button_t = {
    BTN_LEFT: 0,
    BTN_MIDDLE: 1,
	BTN_RIGHT: 2,
    BTN_TAP: 3
};

const rom_type_t =  {
    P1P2: 0xFA2,
    ANGEL: 0xFC4,
    DIGIMON: 0x587,
    MOTHRA: 0x581
}

function get_rom_type() {
    if (!my_program || my_program.length === 0) {
        return rom_type_t.P1P2;
    }
    return my_program[0];
}

/* SEG -> LCD mapping — P1 uses the E0C6S46 40-segment map */
const seg_pos = [0, 1, 2, 3, 4, 5, 6, 7, 32, 8, 9, 10, 11, 12 ,13 ,14, 15, 33, 34, 35, 31, 30, 29, 28, 27, 26, 25, 24, 36, 23, 22, 21, 20, 19, 18, 17, 16, 37, 38, 39];

function hw_init() {
    /* Buttons/Tap sensor are active LOW */
    cpu_set_input_pin(pin_t.PIN_K00, pin_state_t.PIN_STATE_HIGH);
    cpu_set_input_pin(pin_t.PIN_K01, pin_state_t.PIN_STATE_HIGH);
    cpu_set_input_pin(pin_t.PIN_K02, pin_state_t.PIN_STATE_HIGH);
    cpu_set_input_pin(pin_t.PIN_K03, pin_state_t.PIN_STATE_HIGH);

    bz1_ctrl = 0;

    return 0;
}

function hw_release() {
}

var seggers = {};
var prvSeggers = {};


function hw_set_lcd_pin(seg, com, val) {
    //printf("   hw_set_lcd_pin: seg = %u, com = %u, val = %u\n", seg, com, val);
    if (seg_pos[seg] < LCD_WIDTH) {
        if (get_rom_type() == rom_type_t.DIGIMON) {
            g_hal.set_lcd_matrix((LCD_WIDTH - 1) - seg_pos[seg], (LCD_HEIGHT - 1) - com, val);
        } else { // P1P2, angel, mothra
            g_hal.set_lcd_matrix(seg_pos[seg], com, val);
        }
    } else {
        /*
         * IC n -> seg-com|...
         * IC 0 ->  8-0 |18-3 |19-2
         * IC 1 ->  8-1 |17-0 |19-3
         * IC 2 ->  8-2 |17-1 |37-12|38-13|39-14
         * IC 3 ->  8-3 |17-2 |18-1 |19-0
         * IC 4 -> 28-12|37-13|38-14|39-15
         * IC 5 -> 28-13|37-14|38-15
         * IC 6 -> 28-14|37-15|39-12
         * IC 7 -> 28-15|38-12|39-13
         */

        if (seggers[seg] === undefined)
        {
            seggers[seg] = {};
        }
        seggers[seg][com] = val;
        /*if (JSON.stringify(seggers) != JSON.stringify(prvSeggers))
        {
            console.log(seggers);
            prvSeggers = JSON.parse(JSON.stringify(seggers));
        }*/

        if (get_rom_type() == rom_type_t.DIGIMON) {
            if (com == 0) {
                switch(seg) {
                    case 0:
                        g_hal.set_lcd_icon(7, val);
                        break; 
                    case 9:
                        g_hal.set_lcd_icon(6, val);
                        break;
                    case 10:
                        g_hal.set_lcd_icon(5, val);
                        break;
                    case 11:
                        g_hal.set_lcd_icon(4, val);
                        break;
                }
            } else if (com == 15) {
                switch(seg) {
                    case 28:
                        g_hal.set_lcd_icon(0, val);
                        break; 
                    case 37:
                        g_hal.set_lcd_icon(1, val);
                        break;
                    case 38:
                        g_hal.set_lcd_icon(2, val);
                        break;
                    case 39:
                        g_hal.set_lcd_icon(3, val);
                        break;
                }
            }
        } else if (get_rom_type() == rom_type_t.MOTHRA) {
            if (com == 0) {
                switch(seg) {
                    case 8:
                        g_hal.set_lcd_icon(0, val);
                        break; 
                    case 17:
                        g_hal.set_lcd_icon(1, val);
                        break;
                    case 18:
                        g_hal.set_lcd_icon(2, val);
                        break;
                    case 19:
                        g_hal.set_lcd_icon(3, val);
                        break;
                }
            } else if (com == 15) {
                switch(seg) {
                    case 28:
                        g_hal.set_lcd_icon(7, val);
                        break; 
                    case 37:
                        g_hal.set_lcd_icon(6, val);
                        break;
                    case 38:
                        g_hal.set_lcd_icon(5, val);
                        break;
                    case 39:
                        g_hal.set_lcd_icon(4, val);
                        break;
                }
            }
        } else {
            if (seg == 8 && com < 4) {
                g_hal.set_lcd_icon(com, val);
            } else if (seg == 28 && com >= 12) {
                g_hal.set_lcd_icon(com - 8, val);
            }
        }
    }
}

function hw_set_button(btn, state) {
    let pin_state = (state == btn_state_t.BTN_STATE_PRESSED) ? pin_state_t.PIN_STATE_LOW : pin_state_t.PIN_STATE_HIGH;

    switch (btn) {
        case button_t.BTN_TAP:
			cpu_set_input_pin(pin_t.PIN_K03, pin_state);
			break;

        case button_t.BTN_LEFT:
            cpu_set_input_pin(pin_t.PIN_K02, pin_state);
            break;

        case button_t.BTN_MIDDLE:
            cpu_set_input_pin(pin_t.PIN_K01, pin_state);
            break;

        case button_t.BTN_RIGHT:
            cpu_set_input_pin(pin_t.PIN_K00, pin_state);
            break;
    }
}

let bz1_ctrl = 0;

function hw_set_buzzer_ctrl1(value) {
    bz1_ctrl = value;
    hw_set_buzzer_freq(value & 0x7);
}

function hw_set_buzzer_ctrl2(value) {
    const IO_BZSHOT = 0x8;
    const IO_ENVRST = 0x4;
    const IO_ENVON = 0x1;
    const IO_SHOTPW = 0x8;

    if (value & IO_BZSHOT) {
        if (g_hal.trigger_one_shot) {
            g_hal.trigger_one_shot(Boolean(bz1_ctrl & IO_SHOTPW));
        }
    }

    if (value & IO_ENVON) {
        if (g_hal.set_envelope) {
            g_hal.set_envelope(true);
        }
    } else if (g_hal.set_envelope) {
        g_hal.set_envelope(false);
    }

    if (value & IO_ENVRST) {
        if (g_hal.reset_envelope) {
            g_hal.reset_envelope();
        }
    }
}

function hw_set_buzzer_freq(freq) {
    let snd_freq = 0;

    switch (freq) {
        case 0:
            /* 4096.0 Hz */
            snd_freq = 40960;
            break;

        case 1:
            /* 3276.8 Hz */
            snd_freq = 32768;
            break;

        case 2:
            /* 2730.7 Hz */
            snd_freq = 27307;
            break;

        case 3:
            /* 2340.6 Hz */
            snd_freq = 23406;
            break;

        case 4:
            /* 2048.0 Hz */
            snd_freq = 20480;
            break;

        case 5:
            /* 1638.4 Hz */
            snd_freq = 16384;
            break;

        case 6:
            /* 1365.3 Hz */
            snd_freq = 13653;
            break;

        case 7:
            /* 1170.3 Hz */
            snd_freq = 11703;
            break;

        default:
            /* invalid frequency */
            return;
    }
    
    if (snd_freq != 0) {
        g_hal.set_frequency(snd_freq);
    }
}

function hw_enable_buzzer(en) {
    g_hal.play_frequency(en);
}
