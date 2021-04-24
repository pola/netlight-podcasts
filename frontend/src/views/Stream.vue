<template>
  <div v-if="isNotFound">
    <p>The stream you are looking for does not exist.</p>
  </div>

  <div v-else-if="stream !== null">
    <div
      class="notConnected"
      v-if="!isConnected"
    >
      Connection lost. Reconnecting...
    </div>

    <h1>{{ stream.title }}</h1>
    <h3>{{ stream.start | moment('llll') }}</h3>

    <template v-if="stream.readyForStream">
      <template v-if="stream.type === null && stream.linkList.length === 0">
        <p>This live stream is not active. Please come back later.</p>

        <p class="contact">
          <a
            href="https://netlight.slack.com/archives/DJSTMGW1G"
            target="_blank"
          >
            Contact
          </a>
        </p>
      </template>

      <div
        v-else
        :class="{ streamContainer: stream.type !== null }"
      >
        <template v-if="stream.type === 'YOUTUBE'">
          <iframe
            :src="'https://www.youtube.com/embed/' + stream.data.id + '?autoplay=1'"
          />
        </template>

        <template v-if="stream.type === 'AZURE'">
          <iframe
            :src="'/azure.html?data=' + encodeURIComponent(JSON.stringify(stream.data))"
          />
        </template>

        <template v-if="stream.type === 'IFRAME'">
          <iframe
            :src="stream.data.src"
            allowfullscreen
          />
        </template>

        <div
          class="linkContainer"
          v-if="stream.linkList.length > 0"
        >
          <a
            class="button"
            :href="link.url"
            target="_blank"
            v-for="(link, index) in stream.linkList"
            :key="index"
          >
            {{ link.caption }}
          </a>
        </div>

        <form
          v-if="stream.hasInteraction"
          class="interaction"
          @submit.prevent="sendInteractionMessage"
        >
          <input
            type="text"
            v-model="interaction.message"
            :disabled="interaction.isSending || !isConnected"
            :placeholder="interaction.status ? interaction.status : 'Enter a message and press enter'"
          />
        </form>
      </div>
    </template>

    <template v-else>
      <p v-if="stream.blockedByProtection && stream.protection === 'REQUIRE_ACCOUNT'">
        To view this stream, you <a :href="'/login?target=' + encodeURIComponent($router.currentRoute.path)">need to be signed in</a> with your Netlight account.
      </p>

      <form
        v-else-if="stream.lacks.name || stream.lacks.password"
        @submit.prevent="getStreamWithDetails"
      >
        <div style="display: flex; flex-wrap: wrap;">
          <input
            type="text"
            v-model="needs.name"
            v-if="stream.needs.name"
            placeholder="Your name"
            :disabled="$store.state.user !== null"
          />

          <input
            type="password"
            v-model="needs.password"
            v-if="stream.needs.password"
            placeholder="Stream password"
          />
        </div>

        <div style="display: flex; align-items: center;">
          <input
            type="submit"
            value="Enter"
          />

          <div
            v-if="errors.length > 0"
            class="error"
          >
            <div
              style="display: inline-block; margin-right: 5px;"
              v-for="error in errors"
              :key="error"
            >
              {{ error }}
            </div>
          </div>
        </div>

        <p v-if="stream.protection === 'REQUIRE_ACCOUNT_OR_PASSWORD'">
          If you have a Netlight account, you may <a :href="'/login?target=' + encodeURIComponent($router.currentRoute.path)">sign in</a> instead.
        </p>
      </form>
    </template>
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: 'StreamView',
  
  data: () => ({
    stream: null,
    isConnected: false,
    isNotFound: false,
    socket: io(),
    needs: {
      name: window.localStorage.getItem('name') || '',
      password: '',
    },
    tries: {
      name: false,
      password: false,
    },
    errors: null,
    interaction: {
      message: '',
      status: null,
    },
  }),

  async created() {
    this.updateForcedName()

    this.socket.on('connect', () => {
      this.isConnected = true
      this.getStream()
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
    })

    this.socket.on('streamNotFound', () => {
      this.isNotFound = true
    })

    this.socket.on('interactionMessageStatus', ok => {
      const resetMessage = ok ? null : this.interaction.message

      if (ok) {
        this.interaction.message = ''
        this.interaction.status = 'Your message has been sent.'
      } else {
        this.interaction.message = ''
        this.interaction.status = 'Failed to send your message.'
      }
      
      setTimeout(() => {
        this.interaction.isSending = false
        this.interaction.message = resetMessage
        this.interaction.status = null
      }, 5000)
    })

    this.socket.on('stream', stream => {
      this.stream = stream

      const errors = []

      if (this.tries.name && stream.lacks.name) {
        errors.push('Invalid name.')
        this.tries.name = false
      }

      if (this.tries.password && stream.lacks.password) {
        errors.push('Incorrect password.')
        this.tries.password = false
      }

      this.errors = errors
    })

    this.socket.on('streamUpdate', data => {
      this.stream = {
        ...this.stream,
        ...data,
        needs: {
          ...this.stream.needs,
          ...data.needs,
        },
        lacks: {
          ...this.stream.lacks,
          ...data.lacks,
        },
      }
    })
  },

  destroyed() {
    this.socket.disconnect()
    this.socket.off('connect')
    this.socket.off('streamNotFound')
    this.socket.off('stream')
    this.socket.off('streamUpdate')
  },

  methods: {
    updateForcedName() {
      if (this.$store.state.user) {
        this.needs.name = this.$store.state.user.name
      }
    },

    sendInteractionMessage() {
      if (!this.interaction.message) {
        return
      }

      this.interaction.isSending = true

      this.socket.send('interactionMessage', this.interaction.message)
    },

    getStream() {
      this.socket.send('getStream', {
        slug: this.$route.params.slug,
        name: this.needs.name || null,
        password: this.needs.password || null,
      })
    },

    getStreamWithDetails() {
      this.errors = []

      this.tries.name = this.stream.needs.name
      this.tries.password = this.stream.needs.password

      if (this.needs.name) {
        window.localStorage.setItem('name', this.needs.name)
      }

      this.socket.send('getStream', {
        slug: this.$route.params.slug,
        name: this.needs.name || null,
        password: this.needs.password || null,
      })
    },
  },

  watch: {
    '$store.state.user': function() {
      this.updateForcedName()
    },

    '$route.params.slug': function() {
      if (this.isConnected) {
        this.getStream()
      }
    },
  },
}
</script>

<style scoped>
p {
  text-align: center;
}

h1 {
  margin-bottom: 0.5em;
}

form:not(.interaction) {
  margin-top: 1em;
}

form input {
  margin: 5px;
}

form input:not([type='submit']) {
  flex-grow: 1;
  width: auto;
}

.error {
  color: red;
  padding: 10px;
}

.notConnected {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  background-color: rgba(255, 0, 0, 0.5);
  color: #ffffff;
  text-shadow: 0 0 1px #000000;
  text-align: center;
  font-weight: 700;
  font-size: 1.2em;
  z-index: 2000;
  padding: 0.5em;
}

.streamContainer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.streamContainer iframe {
  flex-basis: 100%;
  align-self: stretch;
	border: 0;
	flex: 1;
  background-color: #000000;
}

.interaction {
  background-color: #000000;
}

.interaction input[type='text'] {
  width: 100%;
  display: block;
  margin: 0 auto;
}

.streamContainer .interaction input[type='text'] {
  width: max(800px, 50%);
}

.linkContainer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1em;
}

.streamContainer > .linkContainer {
  margin-top: 0;
  background-color: #000000;
}

.linkContainer > .button {
  margin: 0.5em;
}

.linkContainer + .interaction {
  margin-top: 1.5em;
}

.streamContainer > .linkContainer + .interaction {
  margin-top: 0;
}

@media only screen and (max-width: 768px)
{
	.stream {
		margin-left: -1.5em;
		margin-right: -1.5em;
  }

  .streamContainer .interaction input[type='text'] {
    width: 100%;
    display: block;
    margin: 0 auto;
  }
}
</style>