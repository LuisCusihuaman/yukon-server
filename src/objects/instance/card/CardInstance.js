import BaseInstance from '../BaseInstance'

import CardPlayer from './CardPlayer'


export default class CardInstance extends BaseInstance {

    constructor(waddle) {
        super(waddle)

        this.id = 998

        this.ninjas = {}

        this.rules = { f: 's', w: 'f', s: 'w'}

        this.handleSendDeal = this.handleSendDeal.bind(this)
        this.handlePickCard = this.handlePickCard.bind(this)
    }

    init() {
        super.init()

        for (let user of this.users) {
            this.ninjas[user.id] = new CardPlayer(user)
        }

        for (let user of this.users) {
            let opponent = this.getOpponent(user)

            this.ninjas[user.id].opponent = this.ninjas[opponent.id]
        }
    }

    addListeners(user) {
        user.events.on('send_deal', this.handleSendDeal)
        user.events.on('pick_card', this.handlePickCard)

        super.addListeners(user)
    }

    removeListeners(user) {
        user.events.off('send_deal', this.handleSendDeal)
        user.events.off('pick_card', this.handlePickCard)

        super.removeListeners(user)
    }

    handleSendDeal(args, user) {
        let me = this.ninjas[user.id]

        let cards = me.dealCards()

        user.send('send_deal', { cards: cards })
        me.opponent.send('send_opponent_deal', { deal: cards.length })
    }

    handlePickCard(args, user) {
        let me = this.ninjas[user.id]

        if (!me.isInDealt(args.card) || me.pick) {
            return
        }

        me.pickCard(args.card)

        if (!me.opponent.pick) {
            return
        }

        me.revealCards()
        this.judgeRound(me)
    }

    start() {
        let users = this.users.filter(Boolean).map(user => {
            return {
                username: user.username,
                color: user.color
            }
        })

        this.send('start_game', { users: users })

        super.start()
    }

    judgeRound(me) {
        let winner = this.getRoundWinner()

        me.send('judge', { winner: winner })
        me.opponent.send('judge', { winner: winner })

        me.pick = null
        me.opponent.pick = null
    }

    getRoundWinner() {
        let first = this.getPick(0)
        let second = this.getPick(1)

        return this.getWinningSeat(first, second)
    }

    getWinningSeat(first, second) {
        if (first.element != second.element) {
            return this.compareElements(first, second)
        }

        if (first.value > second.value) {
            return 0
        }

        if (second.value > first.value) {
            return 1
        }

        return -1
    }

    compareElements(first, second) {
        if (this.rules[first.element] == second.element) {
            return 0
        }

        return 1
    }

    getPick(seat) {
        let user = this.users[seat]
        let ninja = this.ninjas[user.id]

        return ninja.pick
    }

    getOpponent(user) {
        let seat = this.getSeat(user)
        let opponentSeat = (seat + 1) % 2

        return this.users[opponentSeat]
    }

}
