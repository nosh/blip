##### Observations

Blip has been built using the main Controller View (app.js) as the coordinator of most of the work.
 - State is stored and managed here
 - It communicates with the API and then updates state, in turn updating child component state
 - It communicates with a Router to update the view.
 - There does seem to a consistent naming convention for variables and functions - no Ubiqituous language
 - The application boots after the API is initialised
   - The API module seems to hold state - isLoggedIn()


With all this logic and responsibility in app.js it is hard to understand the flow of the program.

The application uses callbacks to manage asyncronisity. It may be better to use a mechanism for reducing callback presence, e.g. Promises, which are part of the ES6 spec. This is especially noted when waiting on comms with the API. There is a coupling of code in this aspect moving from the API to the underlying components that respond to an API event.


#### Possible Solutions

I believe we can pull the state out of the controller view and place it into an intermediary 'store' that maintains this state and informs the view accordingly.

One solution is to do this in a Vanilla JS style. Create models for each domain of our application. Defer responsibility for updating state, and talking to an API outside of app.js. This would modularise the code and make it easier to approach. I have created a working branch taking this approach.

Another solution is to adopt a Flux architecture and refactor the application to have a one-directional flow of information. 

The more I consider the Flux architecture, the more I fall in love with its inherent simplicity. We would be able to re-design each component so that we only think of data flowing in one direction. Each component could be designed in isolation. The required props and state could be passed down from parent components. Whenever state changes the component
chain causes an update in child state and appropriate re-rendering. 

Logic for handling responses to events could be stored in one location, per domain. E.g.
 - handlers for all routing events
 - handlers for all auth events

We have the choice of the choice of putting handlers, and message dispatching inside child components, rather than in controller view and passing down as a prop.

The main issue with this approach is that the current implementation is vastly different and does not follow similar modelling principles. Some components would have to be re-written.


